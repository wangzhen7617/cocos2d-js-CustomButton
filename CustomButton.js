/**
 * 自定义按钮
 */
var CustomButton = cc.Sprite.extend({

    // 标识按钮是否可用
    _enable: true,

    // 回调函数
    _callBack: null,
    _callBackTarget: null,

    // 按钮缩放标准值
    _scale: 1.0,

    // 按钮触摸范围绑定框
    _boundingBox: null,

    // 按钮触摸点
    _boundingPoint: null,

    // 按钮点击冷却时间，防止短时间内多次误击
    _cdTime: 0,
    _cdCount: 0,

    // 按钮按下标识
    _touchDown: false,

    // 按钮按下移开标识
    _touchMoved: false,

    // 按钮突出显示标识
    _highShow: false,

    // 按钮点击动作反馈标识
    _enableAction: true,

    // 按钮触摸可移动标识
    _enableTouchMove: true,

    // 按钮触摸在某节点范围内有效节点
    _enableInRangeNode: null,

    // 按钮触摸在某节点范围内无效节点
    _enableExRangeNode: null,

    _canMove: false,

    /**
     * 自定义按钮构造函数
     * @param {string|cc.SpriteFrame} file file name of texture or a SpriteFrame
     * @param callback 回调函数
     * @param target 回调函数归属
     * @param swallow 是否吞噬
     */
    ctor: function (file, callback, target, swallow) {
        if (file && file.indexOf("res") != -1) {
            this._super(file);
        }
        else {
            this._super("#" + file);
        }

        this._callBack = callback;
        this._callBackTarget = target;

        this.setCascadeColorEnabled(true);
        this.setCascadeOpacityEnabled(true);

        // 添加触摸事件
        this._createTouchEvent(swallow);
    },
    _createTouchEvent: function (swallow) {
        if (swallow == undefined) {
            swallow = true;
        }

        var listener = cc.EventListener.create({

            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: swallow,
            onTouchBegan: function (touch, event) {
                var pos = touch.getLocation();
                var target = event.getCurrentTarget();

                this.origTouch = touch.getLocation();

                // 设定按钮有效范围
                if (target._enableInRangeNode) {
                    if (!cc.rectContainsPoint(target._enableInRangeNode.getBoundingBoxToWorld(), pos)) {
                        return false;
                    }
                }

                // 设定按钮无效范围
                if (target._enableExRangeNode) {
                    if (cc.rectContainsPoint(target._enableExRangeNode.getBoundingBoxToWorld(), pos) && target._enableExRangeNode.visible) {
                        return false;
                    }
                }

                // 设定按钮不可见时无效
                var targetParent = target;
                while (targetParent) {
                    if (!targetParent.isVisible()) {
                        return false;
                    }

                    targetParent = targetParent.getParent();
                }

                // 设定按钮冷却时无效
                if (target._cdCount > 0 && target._cdCount < target._cdTime || !target._enable) {
                    return false;
                }

                // 识别按钮在有效范围内触摸点击
                target._boundingPoint = pos;
                target._boundingBox = target.getBoundingBoxToWorld();
                if (cc.rectContainsPoint(target._boundingBox, pos)) {
                    target._runFocusAction();
                    target._touchDown = true;

                    return true;
                }
                return false;
            },
            onTouchMoved: function (touch, event) {
                var pos = touch.getLocation();
                var target = event.getCurrentTarget();


                // 处理触摸移动中的触摸移出有效点击范围
                if (!cc.rectContainsPoint(target._boundingBox, pos) && target._touchMoved == false) {
                    target._touchMoved = true;
                    target._runLoseFocusAction();
                    return;
                }

                // 处理触摸移动中的触摸移回有效点击范围
                if (cc.rectContainsPoint(target._boundingBox, pos) && target._touchMoved == true) {
                    target._touchMoved = false;
                    target._runFocusAction();

                    return;
                }

                return false;


            },
            onTouchEnded: function (touch, event) {
                var pos = touch.getLocation();
                var target = event.getCurrentTarget();
                // 响应有效点击范围的点击事件
                if (cc.rectContainsPoint(target._boundingBox, pos)) {

                    if (target._enableTouchMove) {
                        if (target._callBack && target._callBackTarget) {
                            target._callBackTarget.runAction(cc.callFunc(target._callBack, target._callBackTarget, target));
                        }
                    }
                    else {
                        var moveDistance = (target._boundingPoint.x - pos.x) * (target._boundingPoint.x - pos.x) + (target._boundingPoint.y - pos.y) * (target._boundingPoint.y - pos.y)
                        if (moveDistance < 100) {
                            if (target._callBack && target._callBackTarget) {
                                cc.log("22");
                                target._callBackTarget.runAction(cc.callFunc(target._callBack, target._callBackTarget, target));
                                cc.log("22");

                            }
                        }
                    }

                    target._runLoseFocusAction();
                }

                if (target._cdTime > 0) {
                    target._cdCount = 1;
                    target.schedule(target._cdTimeCount, 1);
                }
                target._touchMoved = false;
                target._touchDown = false;
            }
        });

        cc.eventManager.addListener(listener, this);
    },
    /**
     * 按钮允许点击反馈时的聚焦效果（指触摸点在有效范围内）
     */
    _runFocusAction: function () {
        if (this._enableAction) {
            var qFlexibleAction = cc.sequence
            (
                cc.scaleTo(0.1, this._scale * 0.93, this._scale * 0.93),
                cc.scaleTo(0.1, this._scale * 0.95, this._scale * 0.95)
            );

            this.runAction(qFlexibleAction);
        }
    },
    /**
     * 按钮允许点击反馈时的丢失焦点效果（触摸移出有效范围或者触摸结束）
     */
    _runLoseFocusAction: function () {
        if (this._enableAction) {
            var qFlexibleAction = cc.sequence
            (
                cc.scaleTo(0.1, this._scale * 1.05, this._scale * 1.05),
                cc.scaleTo(0.1, this._scale * 1.00, this._scale * 1.00)
            );
            this.runAction(qFlexibleAction);
        }
    },
    /**
     * 按钮突出显示效果，也就是高亮效果，此处缩放动作实现
     */
    _runHighShowAction: function () {
        if (this._enableAction) {
            if (!this._touchDown) {
                qFlexibleAction = cc.sequence
                (
                    cc.scaleTo(1, this._scale * 1.05, this._scale * 1.25),
                    cc.scaleTo(1, this._scale, this._scale)
                );
                this.runAction(qFlexibleAction);
            }
        }
    },
    /**
     * 按钮冷却时间处理函数
     */
    _cdTimeCount: function () {
        this._cdCount++;
        cc.log(this._cdCount + "---" + this._cdTime);
        if (this._cdCount > this._cdTime) {
            this._cdCount = 0;
            this.unschedule(this._cdTimeCount);
        }
    },
    onEnter: function () {
        this._super();

        // 记录按钮初始状态
        this._scale = this.scale;
        this._touchMoved = false;
        this._touchDown = false;
        this._cdCount = 0;

        this.setHighShow(this._highShow);
    },
    onExit: function () {
        this._super();

        this.unschedule(this._runHighShowAction);
        this.unschedule(this._cdTimeCount);
        this.stopAllActions();

        // 重置按钮初始状态（有时候控件虽然移除，但是并未清理。如此控件retain()了，那么此保存重置对于再次激活使用是必须操作）
        this.scale = this._scale;
        this._touchMoved = false;
        this._touchDown = false;
        this._cdCount = 0;

        this._highShow = false;
    },
    /**
     * 设置控件是否允许点击（默认允许）
     * @param able bool
     */
    setEnable: function (able) {
        if (this._enable != able) {
            this._enable = able;
        }
    },
    /**
     * 设置控件冷却时间（默认为0，不激活冷却）
     * @param second float
     */
    setColdTime: function (second) {
        this._cdTime = second;
    },
    /**
     * 设置控件是否激活突出高亮显示（默认不激活）
     * @param highShow bool
     */
    setHighShow: function (highShow) {
        if (this._highShow != highShow) {
            this._highShow = highShow;
            if (this._highShow) {
                this.schedule(this._runHighShowAction, 2, -1, 0.01);
            }
            else {
                this.unschedule(this._runHighShowAction);
            }
        }
    },
    /**
     * 重置按钮回调事件（主要应用于重写某定义于父类的按钮事件）
     * @param callback
     * @param target
     */
    resetCallback: function (callback, target) {
        this._callBack = callback;
        this._callBackTarget = target;
    },
    /**
     * 设计触摸反馈是否激活（默认激活）
     * @param able bool
     */
    setEnableAction: function (able) {
        if (this._enableAction != able) {
            this._enableAction = able;
        }
    },
    /**
     * 设计触摸后是否允许触摸移动（默认允许，不允许时其实也可以10像素内移动（容错处理））
     * @param able bool
     */
    setEnableTouchMove: function (able) {
        if (this._enableTouchMove != able) {
            this._enableTouchMove = able;
        }
    },
    /**
     * 设置按钮有效范围，以节点触摸绑定框为准（一般可以创建一个不绘制的sprite来确定此范围）
     * @param node cocos node极其子类
     */
    setEnableInRangeNode: function (node) {
        this._enableInRangeNode = node;
    },
    /**
     * 设置按钮无效范围，以节点触摸绑定框为准（一般可以创建一个不绘制的sprite来确定此范围）
     * @param node cocos node极其子类
     */
    setEnableExRangeNode: function (node) {
        this._enableExRangeNode = node;
    },
    /**
     * 设置是否可以拖动节点
     */
    setCanMove: function (able) {
        if (this._canMove != able) {
            this._canMove = able;
        }
    }

});
