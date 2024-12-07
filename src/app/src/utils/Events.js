// Suggested code may be subject to a license. Learn more: ~LicenseLog:1529393553.
/*
the caller should define the window event and call startDrag with the appropiate values
*/

import {gn, scaleMultiplier, isTablet} from './lib';

let dragged = false;
let dragthumbnail;
let dragmousex = 0;
let dragmousey = 0;
let timeoutEvent;
let dragcanvas;
let dragDiv;
let fcnstart;
let fcnend;
let updatefcn;
let fcnclick;
let scaleStartsAt = 1;
let delta = 10;
let pinchcenter = {
    x: 0,
    y: 0,
    distance: 0
};
let lastZoomScale = 1;

export default class Events {
    // Getters/setters for globally used properties
    static get dragged () {
        return dragged;
    }

    static set dragged (newDragged) {
        dragged = newDragged;
    }

    static get dragthumbnail () {
        return dragthumbnail;
    }

    static set dragthumbnail (newDragthumbnail) {
        dragthumbnail = newDragthumbnail;
    }

    static get dragmousex () {
        return dragmousex;
    }

    static set dragmousex (newDragmousex) {
        dragmousex = newDragmousex;
    }

    static get dragmousey () {
        return dragmousey;
    }

    static set dragmousey (newDragmousey) {
        dragmousey = newDragmousey;
    }

    static get timeoutEvent () {
        return timeoutEvent;
    }

    static set timeoutEvent (newTimeoutEvent) {
        timeoutEvent = newTimeoutEvent;
    }

    static get dragcanvas () {
        return dragcanvas;
    }

    static set dragcanvas (newDragcanvas) {
        dragcanvas = newDragcanvas;
    }

    static get dragDiv () {
        return dragDiv;
    }

    static get scaleStartsAt () {
        return scaleStartsAt;
    }

    static set scaleStartsAt (newScaleStartsAt) {
        scaleStartsAt = newScaleStartsAt;
    }

    static get pinchcenter () {
        return pinchcenter;
    }

    // Instead of popping the dragging block, etc to the outer-most frame,
    // which causes delays while the content is reflowed, we create a
    // small drag div that is a parent of frame that the dragging block
    // can be a child of. This improves dragging performance.
    static init () {
        dragDiv = document.createElement('div');
        dragDiv.id = 'dragDiv';
        dragDiv.style.position = 'absolute';
        dragDiv.style.width = '0px'; // size doesn't matter since children float
        dragDiv.style.height = '0px';
        dragDiv.style.zIndex = 7001; // slightly higher than ScratchJr.dragginLayer
        var frameDiv = gn('frame');
        frameDiv.appendChild(dragDiv);
    }
    static startDrag (e, c, atstart, atend, atdrag, atclick, athold) {
        dragged = false;
        var pt = Events.getTargetPoint(e);
        dragmousex = pt.x;
        dragmousey = pt.y;
        dragthumbnail = c;
        fcnstart = atstart;
        fcnend = atend;
        fcnclick = atclick;

        if (athold) {
            Events.holdit(c, athold);
        }
        updatefcn = atdrag;
        if (isTablet) { // startDrag event setting
            delta = 20 * scaleMultiplier;
            window.ontouchmove = function (evt) {
                Events.touchMove(evt);
            };
            window.ontouchend = function (evt) {
                Events.touchEnd(evt);
            };
            window.ontouchleave = window.ontouchend;
            window.ontouchcancel = window.ontouchend;
        } else {
            delta = 10;
            window.onmousemove = function (evt) {
                Events.mouseMove(evt);
            };
            window.onmouseup = function (evt) {
                Events.mouseUp(evt);
            };
        }
    }

    static holdit (c, fcn) {
        var repeat = function () {
            Events.clearEvents();
            fcn(dragthumbnail);
            Events.clearDragAndDrop();
        };
        timeoutEvent = setTimeout(repeat, 500);
    }

    static clearDragAndDrop () {
        timeoutEvent = undefined;
        dragcanvas = undefined;
        dragged = false;
        dragthumbnail = undefined;
        fcnstart = undefined;
        fcnend = undefined;
        updatefcn = undefined;
        fcnclick = undefined;
    }

    static touchMove (e) {
        if (e.touches.length > 1) {
            return;
        }
        Events.mouseMove(e);
    }

    static touchEnd (e) {
        if (e.touches.length > 1) {
            return;
        }
        if (updatefcn) {
            updatefcn(e, dragcanvas); // update to final position
        }
        Events.mouseUp(e);
    }
    static mouseMove (e) {
        // be forgiving about the click
        var pt = Events.getTargetPoint(e);
        if (!dragged && (Events.distance(dragmousex - pt.x, dragmousey - pt.y) < delta)) {
            return;
        }
        if (timeoutEvent) {
            clearTimeout(timeoutEvent);
        }
        timeoutEvent = undefined;
        if (!dragged) {
            fcnstart(e);
        }
        dragged = true;
        if (updatefcn) {
            updatefcn(e, dragcanvas);
        }
        dragmousex = pt.x;
        dragmousey = pt.y;
    }

    static distance (dx, dy) {
        return Math.round(Math.sqrt((dx * dx) + (dy * dy)));
    }

    static mouseUp (e) {
        if (timeoutEvent) {
            clearTimeout(timeoutEvent);
        }
        timeoutEvent = undefined;
        Events.clearEvents();
        if (!dragged) {
            Events.itIsAClick(e);
        } else {
            Events.performMouseUpAction(e);
        }
        Events.clearDragAndDrop();
    }

    static cancelAll () {
        if (timeoutEvent) {
            clearTimeout(timeoutEvent);
        }
        timeoutEvent = undefined;
        Events.clearEvents();
    }

    static clearEvents () {
        if (isTablet) { // clearEvents
            window.ontouchmove = undefined;
            window.ontouchend = undefined;
        } else {
            window.onmousemove = function (e) {
                e.preventDefault();
            };
            window.onmouseup = undefined;
        }
    }

    static performMouseUpAction (e) {
        if (fcnend) {
            fcnend(e, dragcanvas);
        }
    }

    static itIsAClick (e) {
        if (fcnclick) {
            fcnclick(e, dragthumbnail);
        }
    }

    static moveThumbnail (el, dx, dy) {
        if (!el) {
            return;
        }
        el.top += dy;
        el.left += dx;
        el.style.top = el.top + 'px';
        el.style.left = el.left + 'px';
    }

    static move3D (el, dx, dy) {
        if (!el) {
            return;
        }
        var mtx = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
        el.top = dy + mtx.m42;
        el.left = dx + mtx.m41;
        el.style.webkitTransform = 'translate3d(' + el.left + 'px,' + el.top + 'px, 0)';
    }


    /*
    .m41 – corresponds to the ‘x’ value of a WebKitCSSMatrix
    .m42 – corresponds to the ‘y’ value of a WebKitCSSMatrix
    
    
    The clientX read-only property of the MouseEvent interface provides the horizontal 
    coordinate within the application's client area at which the event occurred 
    (as opposed to the coordinates within the page). 
    
    For example, clicking in the top-left corner of the client area will always 
    result in a mouse event with a clientX value of 0, regardless of whether the 
    page is scrolled horizontally.
    */

    static getTargetPoint (e) {
        if (isTablet) {
            if (e.touches && (e.touches.length > 0)) {
                return {
                    x: e.touches[0].pageX,
                    y: e.touches[0].pageY
                };
            } else if (e.changedTouches) {
                return {
                    x: e.changedTouches[0].pageX,
                    y: e.changedTouches[0].pageY
                };
            }
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }

    static updatePinchCenter (e) {
        if (e.touches.length != 2) {
            return;
        }
        var x1 = e.touches[0].clientX,
            y1 = e.touches[0].clientY;
        var x2 = e.touches[1].clientX,
            y2 = e.touches[1].clientY;
        var cx = x1 + (x2 - x1) / 2,
            cy = y1 + (y2 - y1) / 2;
        var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        pinchcenter = {
            x: cx,
            y: cy,
            distance: d
        };
    }

    static zoomScale (e) {
        if (e.touches.length !== 2) {
            return lastZoomScale;
        }
        var x1 = e.touches[0].clientX,
            y1 = e.touches[0].clientY;
        var x2 = e.touches[1].clientX,
            y2 = e.touches[1].clientY;
        var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        lastZoomScale = d / pinchcenter.distance;
        return lastZoomScale;
    }
}
