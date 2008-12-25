/*
Pie-style javascript menu using YUI3
Mikhail Panchenko <m@mihasya.com>
BSD License - have at it!
http://developer.yahoo.net/yui/license.txt
*/

YUI.add('piemenu', function(Y) {

/*define the item class that we will use later*/
function pieItem(el, anchor) {
    var _el, _anchor, _x, _y, _width, _height, _region, _actual_x, _actual_y;

    var _anim; //this item's animation object

    _el = el;
    _region = _el.get('region');
    _anchor = anchor;
    _el.setStyle('position', 'absolute');
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
            if (new_x) {
                _x = new_x;
                switch (_anchor) {
                    case ANCHOR_CENTER: {
                        _actual_x = new_x - _region['width']/2;
                        break;
                    }
                    case ANCHOR_TOPLEFT: {
                        _actual_x = new_x;
                        break;
                    }
                }
            }
            if (new_y) {
                _y = new_y;
                switch (_anchor) {
                    case ANCHOR_CENTER: {
                        _actual_y = new_y - _region['height']/2;
                        break;
                    }
                    case ANCHOR_TOPLEFT: {
                        _actual_y = new_y;
                        break;
                    }
                }
            }
            //dimensions
            if (new_width && new_width == ITEM_SIZE_ORIG) {
                _width = _region['width'];
            } else if (new_width !== null) {
                _width = new_width;
            }
            if (new_height && new_height == ITEM_SIZE_ORIG) {
                _height = _region['height'];
            } else if (new_height !== null) {
                _height = new_height;
            }
            return;
        },
        repositionHard: function(new_x, new_y, new_width, new_height) {
            this.reposition(new_x, new_y, new_width, new_height);
            _el.setStyle('left', _actual_x+'px');
            _el.setStyle('top', _actual_y+'px');
            _el.setStyle('width', _width);
            _el.setStyle('height', _height);
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
        getActualX: function() {
            return _actual_x;
        },
        getActualY: function() {
            return _actual_y;
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
            value: .15
        }
    }
});

//add methods
Y.extend(Piemenu, Y.Widget, {
    _items:     [],
    _center:    {},
    _loseHandle: null,
    
    /*append/remove any needed elements*/
    renderUI: function() {
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
        this._items[this._items.length-1].getAnim().on('end', this._getFocus, this);
        this._animate();
        this.show();
    },
    show: function() {
        this.get(BOUNDING_BOX).setStyle('visibility', 'visible');
    },
    close: function() {
        this.closing = true;
        this._hideItems();
        this._scheduleAnimation();
        this._items[this._items.length-1].getAnim().on('end', this.hide, this);
        this._loseHandle.detach();
        this._loseHandle = null;
        this._animate();
    },
    hide: function() {
        if (this.closing) {
            this.get(BOUNDING_BOX).setStyle('visibility', 'hidden');
        }
    },
    move: function(x, y) {
        this.set('x', x);
        this.set('y', y);
        this.renderUI();
    },
    /*bind events*/
    bindUI: function() {
        
    },
    /*sync widget with state*/
    syncUI: function() {
        this.hide(); //hide while we set hte table
        var cb = this.get(CONTENT_BOX);
        //since .each usurps this., we need to localize the vars
        var items = this._items;
        center=this._center;
        center['x'] = this.get(WIDTH) / 2;
        center['y'] = this.get(HEIGHT) / 2;
        var children = cb.get('children');
        var anchor = this.get(ITEMANCHOR);
        children.each(function(child) {
            var item = new pieItem(child, anchor);
            item.repositionHard(center['x'], center['y'], 0, 0);
            items.push(item);
        });
        if (this.get(VISIBLE) == true) {
            this.open();
        }
    },
    _scheduleAnimation: function() {
        var len = this._items.length;
        for (var i = 0; i < len; i++) {
            var item = this._items[i];
            var anim = new Y.Anim({
                node: item.getEl(),
                to: {
                    left: item.getActualX(),
                    top: item.getActualY(),
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
            this._items[i].reposition(x, y, 0, 0);
        }
    },
    _getFocus: function(e) {
        if (!this._loseHandle) {
            this._loseHandle = Y.on('click', this._loseFocus, 'document', this);
        }
    },
    _loseFocus: function(e) {
        var target = e.target;
        if (target!=this.get(BOUNDING_BOX)) {
            this.close();
        }
    }
});

//add to the YUI object.
Y.Piemenu = Piemenu;

}, '3.0.0pr2' ,{requires:['widget','anim']});