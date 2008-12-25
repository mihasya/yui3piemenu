/*
Pie-style javascript menu using YUI3
Mikhail Panchenko <m@mihasya.com>
BSD License - have at it!
http://developer.yahoo.net/yui/license.txt
*/

YUI.add('piemenu', function(Y) {

/*define the item class that we will use later*/
function pieItem(el, anchor) {
    var _el, _anchor, _x, _y, _width, _height, _region;

    var _anim; //this item's animation object

    _el = el;
    _region = _el.get('region');
    _anchor = anchor;
    _el.setStyle('overflow', 'hidden');

    _region = _el.get('region');
    _width = _region['width'];
    _height = _region['height'];
    
    return {
        getAnim: function() {
            return _anim;
        },
        setAnim: function(anim) {
            _anim = anim;
        },
        runAnim: function() {
            _anim.run();
        },
        //set item properties. this might be getting sloppy...
        reposition: function(new_x, new_y, new_width, new_height) {
            switch (_anchor) {
                case ANCHOR_CENTER: {
                    _x = new_x - _region['width']/2;
                    _y = new_y - _region['width']/2;
                    break;
                }
                case ANCHOR_TOPLEFT: {
                    _x = new_x;
                    _y = new_y;
                    break;
                }
            }
            //dimensions
            if (new_width && new_width == ITEM_SIZE_ORIG) {
                _width = _region['width'];
            } else if (new_width !== null) {
                _width = new_width;
            } else {
                _width = _region['width'];
            }
            if (new_height && new_height == ITEM_SIZE_ORIG) {
                _height = _region['height'];
            } else if (new_height !== null) {
                _height = new_height;
            } else {
                _width = _region['width'];
            }
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
        },
        getWidth: function() {
            return _width;
        },
        getHeight: function() {
            return _height;
        }
    };
}
    
//constants
var CONTENT_BOX =   'contentBox',
    BOUNDING_BOX =  'boundingBox',
    
    //attribute constants
    WIDTH    = 'width',
    HEIGHT   = 'height',
    RADIUS   = 'radius',
    VISIBLE  = 'visible',

    ANCHOR   = 'anchor',
    ITEMANCHOR = 'itemAnchor',
    ANCHOR_CENTER   = 'center',
    ANCHOR_TOPLEFT  = 'topleft',
    ANCHOR_NONE  = 'none',

    ITEM_SIZE_ORIG = '-1',

    ANIM_DELAY = 'animDelay',
    
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
        },
        itemAnchor: {
            value: ANCHOR_CENTER
        },
        animate: {
            value: true
        },
        animDelay: {
            value: .25
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
    open: function() {
        this.closing = false;
        this._positionItems();
        this._scheduleAnimation();
        this._animate();
        this.show();
    },
    show: function() {
        this.get(BOUNDING_BOX).setStyle('visibility', 'visible');
    },
    close: function() {
        this.closing = true;
        this._hideItems();
        this._scheduleClose();
        this._animate();
    },
    hide: function() {
        if (this.closing) {
            this.get(BOUNDING_BOX).setStyle('visibility', 'hidden');
        }
    },
    /*bind events*/
    bindUI: function() {
        
    },
    /*sync widget with state*/
    syncUI: function() {
        var cb = this.get(CONTENT_BOX);
        //since .each usurps this., we need to localize the vars
        items = this._items;
        center=this._center;
        center['x'] = this.get(WIDTH) / 2;
        center['y'] = this.get(HEIGHT) / 2;
        var children = cb.get('children');
        var anchor = this.get(ITEMANCHOR);
        children.each(function(child) {
            child.setStyle('left', center['x']+'px');
            child.setStyle('top', center['y']+'px');
            items.push(new pieItem(child, anchor));
            child.setStyle('width', 0);
            child.setStyle('height', 0);
        });
        if (this.get(VISIBLE) == true) {
            this.open();
        }
    },
    //broken out into its own function for now to ensure 0 target sizes
    _scheduleClose: function() {
        var len = this._items.length;
        for (var i = 0; i < len; i++) {
            var item = this._items[i];
            var anim = new Y.Anim({
                node: item.getEl(),
                to: {
                    left: item.getX(),
                    top: item.getY(),
                    width: 0,
                    height: 0
                }
            });
            anim.set('duration', this.get(ANIM_DELAY));
            if (i == len - 1) {
                anim.on('end', this.hide, this);
            }
            item.setAnim(anim);
        }
    },
    _scheduleAnimation: function() {
        var len = this._items.length;
        for (var i = 0; i < len; i++) {
            var item = this._items[i];
            var anim = new Y.Anim({
                node: item.getEl(),
                to: {
                    left: item.getX(),
                    top: item.getY(),
                    width: item.getWidth(),
                    height: item.getHeight()
                }
            });
            anim.set('duration', this.get(ANIM_DELAY));
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
        var r = this.get(RADIUS);
        for (var i=0; i<len;i++) {
            var new_x = this._center['x'] + sin(slice * i + skew) * r;
            var new_y = this._center['y'] - cos(slice * i + skew) * r;
            this._items[i].reposition(new_x, new_y, 
                                ITEM_SIZE_ORIG, ITEM_SIZE_ORIG);
        }
    },
    _hideItems: function() {
        var len = this._items.length;
        var x = this._center['x'];
        var y = this._center['y'];
        for (var i=0; i<len;i++) {
            this._items[i].reposition(x, y, 0 , 0);
        }
    }
});

//add to the YUI object.
Y.Piemenu = Piemenu;

}, '3.0.0pr2' ,{requires:['widget','anim']});