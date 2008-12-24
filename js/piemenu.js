/*
Pie-style javascript menu using YUI3
Mikhail Panchenko <m@mihasya.com>
BSD License - have at it!
http://developer.yahoo.net/yui/license.txt
*/

/*define the item class that we will use later*/
function pieItem(el, conf) {
    var _el, _width, _height, _anchor, _x, _y;
    
    var _anim; //this item's animation object
    
    _el = el;
    
    return {
        setAnim: function(anim) {
            _anim = anim;
        },
        runAnim: function() {
            _anim.run();
        },
        reposition: function(new_x, new_y) {
            _x = new_x;
            _y = new_y;
            return;
        },
        getEl: function() {
            return _el;
        },
        getX: function() {
            return _x;
        },
        getY: function() {
            return _y;
        }
    };
}

YUI.add('piemenu', function(Y) {
    
//constants
var CONTENT_BOX =   'contentBox',
    BOUNDING_BOX =  'boundingBox',
    
    //attribute constants
    WIDTH    = 'width',
    HEIGHT   = 'height',
    RADIUS   = 'radius',
    VISIBLE  = 'visible',
    ANCHOR   = 'anchor',
    ANCHOR_CENTER   = 'center',
    ANCHOR_TOPLEFT  = 'topleft',
    ANCHOR_NONE  = 'none',
    
    //math stuff
    sin      = Math.sin,
    cos      = Math.cos,
    pi       = Math.PI,
    circle   = pi * 2,
    
    PIEMENU = 'piemenu';
//eo constants

//constructor
function Piemenu() {
    Piemenu.superclass.constructor.apply(this,arguments);
}

//add properties
Y.mix(Piemenu, { 
    NAME : PIEMENU,
    ATTRS: {
        width: {
            value: 400
        },     
        height: {
            value: 400
        },
        radius: {
            value: 100
        },
        visible: {
            value: false
        },
        x: {
            value: null
        },
        y: {
            value: null
        },
        anchor: {
            value: ANCHOR_CENTER
        }
    }
});

//add methods
Y.extend(Piemenu, Y.Widget, {
    _items:     [],
    _center:    {},
    /*append/remove any needed elements*/
    renderUI: function() {
        this.hide(); //hide while we set hte table
        var bb = this.get(BOUNDING_BOX);
        switch (this.get(ANCHOR)) {
            case ANCHOR_TOPLEFT: {
                bb.setStyle('position', 'absolute');
                bb.setStyle('left',this.get('x')+'px');
                bb.setStyle('top', this.get('y')+'px');
                break;
            }
            case ANCHOR_CENTER: {
                bb.setStyle('position', 'absolute');
                bb.setStyle('left',this.get('x')-this.get(WIDTH)/2+'px');
                bb.setStyle('top', this.get('y')-this.get(HEIGHT)/2+'px');
                break;
            }
            case ANCHOR_NONE: {
                bb.setStyle('position', 'relative');
                break;
            }
        }
    },
    
    show: function() {
        this.get(BOUNDING_BOX).setStyle('display', 'block');
    },
    hide: function() {
        this.get(BOUNDING_BOX).setStyle('display', 'none');
    },
    /*bind events*/
    bindUI: function() {
        
    },
    /*sync widget with state*/
    syncUI: function() {
        var cb = this.get(CONTENT_BOX);
        var children = cb.get('children');
        //since .each usurps this., we need to localize the vars
        center=this._center;
        center['x'] = this.get(WIDTH) / 2;
        center['y'] = this.get(HEIGHT) / 2;
        items = this._items;
        children.each(function(child) {
            child.setStyle('left', center['x']+'px');
            child.setStyle('top', center['y']+'px');
            items.push(new pieItem(child, {}));
        });
        if (this.get(VISIBLE) == true) {
            this.show();
            this._positionItems();
            this._scheduleAnimation();
            this._animate();
        }
    },
    _scheduleAnimation: function() {
        var len = this._items.length;
        var i = 0;
        for (i = 0; i < len; i++) {
            var item = this._items[i];
            var anim = new Y.Anim({
                node: item.getEl(),
                to: {
                    left: item.getX(),
                    top: item.getY(),
                }
            });
            anim.set('duration', .5)
            item.setAnim(anim);
        }
    },
    _animate: function (item) {
        var len = this._items.length;
        var i = 0;
        for (i = 0; i < len; i++) {
            this._items[i].runAnim();
        }
    },
    _positionItems: function(skew) {
        skew = (skew) ? skew = (circle/360) * skew : 0;

        var len = this._items.length;
        var slice = circle / len;
        var i;
        var r = this.get(RADIUS);
        for (i=0; i<len;i++) {
            var new_x = this._center['x'] + sin(slice * i + skew) * r;
            var new_y = this._center['y'] - cos(slice * i + skew) * r;
            this._items[i].reposition(new_x, new_y);
        }
    }
    
});

//add to the YUI object.
Y.Piemenu = Piemenu;

}, '3.0.0pr2' ,{requires:['widget','anim']});