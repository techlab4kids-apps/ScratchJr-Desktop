import Lobby from './Lobby';
import iOS from '../iPad/iOS';
import IO from '../iPad/IO';
import Project from '../editor/ui/Project';
import Localization from '../utils/Localization';
import ScratchAudio from '../utils/ScratchAudio';
import Vector from '../geom/Vector';
import {gn, newHTML, isTablet} from '../utils/lib';

let frame;
let scrollvalue;
let version;
let timeoutEvent;

export default class Home {
    static init() {
        version = Lobby.version;
        frame = gn('htmlcontents');

        var inner = newHTML('div', 'inner', frame);
        var div = newHTML('div', 'scrollarea', inner);
        div.setAttribute('id', 'scrollarea');

        // Add event listeners depending on device type
        if (isTablet) {
            frame.addEventListener('touchstart', Home.handleTouchStart, { passive: false });
            frame.addEventListener('touchmove', Home.handleMove, { passive: false });
            frame.addEventListener('touchend', Home.handleTouchEnd, { passive: false });
        } else {
            frame.addEventListener('mousedown', Home.handleTouchStart, false);
            frame.addEventListener('mousemove', Home.handleMove, false);
            frame.addEventListener('mouseup', Home.handleTouchEnd, false);
        }

        Home.displayYourProjects();
    }

    static emptyProjectThumbnail(parent) {
        var tb = newHTML('div', 'projectthumb', parent);
        newHTML('div', 'aproject empty', tb);
        tb.id = 'newproject';
    }

    //////////////////////////
    // Events
    //////////////////////////

    static handleTouchStart(e) {
        // Normalize event (touch or mouse)
        Home.dragging = false;
        Home.holding = false;

        var mytarget = Home.getMouseTarget(e);
        if ((mytarget != Home.actionTarget) && Home.actionTarget && (Home.actionTarget.childElementCount > 2)) {
            Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility = 'hidden';
        }

        Home.actionTarget = mytarget;
        Home.initialPt = Events.getTargetPoint(e);
        Home.scrolltop = document.body.scrollTop;

        if (Home.actionTarget) {
            Home.setHoldTimeout();
        }
    }

    static setHoldTimeout() {
        // On long press show delete button
        var repeat = function() {
            if (Home.actionTarget && (Home.actionTarget.childElementCount > 2)) {
                Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility = 'visible';
                Home.holding = true;
            }
        };
        timeoutEvent = setTimeout(repeat, 500);
    }

    static handleMove(e) {
        // If user moves finger/mouse far enough, consider it dragging
        var pt = Events.getTargetPoint(e);
        var delta = Vector.diff(pt, Home.initialPt);

        if (!Home.dragging && (Vector.len(delta) > 20)) {
            Home.dragging = true;
        }

        if (Home.dragging) {
            if (timeoutEvent) {
                clearTimeout(timeoutEvent);
            }
            timeoutEvent = undefined;
        }
    }

    static handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();

        // Clear move events
        if (!isTablet) {
            frame.onmousemove = undefined;
        }

        if (timeoutEvent) {
            clearTimeout(timeoutEvent);
        }
        timeoutEvent = undefined;

        if (Home.dragging) {
            return;
        }

        Home.performAction(e);
    }

    static getMouseTarget(e) {
        var t = e.target;
        if (t == frame) {
            return null;
        }

        if (t.parentNode && !t.parentNode.tagName) {
            return null;
        }

        while (t.parentNode && (t.parentNode != frame) && (t.parentNode.getAttribute('class') != 'scrollarea')) {
            t = t.parentNode;
        }
        return (!t.parentNode || (t.parentNode == frame)) ? null : t;
    }

    static performAction(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!Home.actionTarget) {
            return;
        }

        if (Home.holding) {
            return;
        }

        var md5 = Home.actionTarget.id;
        switch (Home.getAction(e)) {
            case 'project':
                ScratchAudio.sndFX('keydown.wav');
                if (md5 && (md5 == 'newproject')) {
                    Home.createNewProject();
                } else if (md5) {
                    iOS.setfile('homescroll.sjr', gn('wrapc').scrollTop, function() {
                        doNext(md5);
                    });
                }
                break;
            case 'delete':
                ScratchAudio.sndFX('cut.wav');
                Project.thumbnailUnique(Home.actionTarget.thumb, Home.actionTarget.id, function(isUnique) {
                    if (isUnique) {
                        iOS.remove(Home.actionTarget.thumb, iOS.trace);
                    }
                });
                iOS.setfield(iOS.database, Home.actionTarget.id, 'deleted', 'YES', Home.removeProjThumb);
                break;
            default:
                if (Home.actionTarget && (Home.actionTarget.childElementCount > 2)) {
                    Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility = 'hidden';
                }
                break;
        }

        function doNext(md5) {
            iOS.analyticsEvent('lobby', 'existing_project_edited');
            window.location.href = 'editor.html?pmd5=' + md5 + '&mode=edit';
        }
    }

    static createNewProject() {
        iOS.analyticsEvent('lobby', 'project_created');
        var obj = {};
        obj.name = Home.getNextName(Localization.localize('NEW_PROJECT_PREFIX'));
        obj.version = version;
        obj.mtime = (new Date()).getTime().toString();
        IO.createProject(obj, Home.gotoEditor);
    }

    static gotoEditor(md5) {
        iOS.setfile('homescroll.sjr', gn('wrapc').scrollTop, function() {
            doNext(md5);
        });

        function doNext(md5) {
            window.location.href = 'editor.html?pmd5=' + md5 + '&mode=edit';
        }
    }

    static getNextName(name) {
        var pn = [];
        var div = gn('scrollarea');
        for (var i = 0; i < div.childElementCount; i++) {
            if (div.childNodes[i].id == 'newproject') {
                continue;
            }
            pn.push(div.childNodes[i].childNodes[1].childNodes[0].textContent);
        }
        var n = 1;
        while (pn.indexOf(name + ' ' + n) > -1) {
            n++;
        }
        return name + ' ' + n;
    }

    static removeProjThumb() {
        if (Home.actionTarget && Home.actionTarget.parentNode) {
            Home.actionTarget.parentNode.removeChild(Home.actionTarget);
        }
        Home.actionTarget = undefined;
    }

    static getAction(e) {
        if (!Home.actionTarget) {
            return 'none';
        }
        var shown = (Home.actionTarget.childElementCount > 2) ?
            Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility == 'visible' :
            false;

        if (e && shown) {
            var t;
            if (window.event) {
                t = window.event.srcElement;
            } else {
                t = e.target;
            }
            if (t.getAttribute('class') == 'closex') {
                return 'delete';
            }
        }
        return 'project';
    }

    //////////////////////////
    // Gather projects
    //////////////////////////

    static displayYourProjects() {
        iOS.getfile('homescroll.sjr', gotScrollsState);
        function gotScrollsState(str) {
            var num = Number(atob(str));
            scrollvalue = (num.toString() == 'NaN') ? 0 : num;
            var json = {};
            json.cond = 'deleted = ? AND version = ? AND gallery IS NULL';
            json.items = ['name', 'thumbnail', 'id', 'isgift'];
            json.values = ['NO', version];
            json.order = 'ctime desc';
            IO.query(iOS.database, json, Home.displayProjects);
        }
    }

    static displayProjects(str) {
        var data = JSON.parse(str);
        var div = gn('scrollarea');
        while (div.childElementCount > 0) {
            div.removeChild(div.childNodes[0]);
        }

        Home.emptyProjectThumbnail(div);
        for (var i = 0; i < data.length; i++) {
            Home.addProjectLink(div, data[i]);
        }

        setTimeout(function() {
            Lobby.busy = false;
        }, 1000);

        if (gn('wrapc')) {
            gn('wrapc').scrollTop = scrollvalue;
        }
    }

    static addProjectLink(parent, aa) {
        var data = IO.parseProjectData(aa);
        var id = data.id;
        var th = data.thumbnail;
        if (!th) {
            return;
        }

        var thumb = (typeof th === 'string') ? JSON.parse(th) : th;
        var pc = thumb.pagecount ? thumb.pagecount : 1;

        var tb = newHTML('div', 'projectthumb', parent);
        tb.setAttribute('id', id);
        tb.type = 'projectthumb';
        tb.thumb = thumb.md5;

        var mt = newHTML('div', 'aproject p' + pc, tb);
        Home.insertThumbnail(mt, 192, 144, thumb);

        var label = newHTML('div', 'projecttitle', tb);
        var txt = newHTML('h4', undefined, label);
        txt.textContent = data.name;

        var bow = newHTML('div', 'share', tb);
        var ribbonHorizontal = newHTML('div', 'ribbonHorizontal', tb);
        var ribbonVertical = newHTML('div', 'ribbonVertical', tb);

        if (data.isgift != '0') {
            bow.style.visibility = 'visible';
            ribbonHorizontal.style.visibility = 'visible';
            ribbonVertical.style.visibility = 'visible';
        }

        newHTML('div', 'closex', tb);
    }

    static insertThumbnail(p, w, h, data) {
        var md5 = data.md5;
        var img = newHTML('img', undefined, p);
        if (md5) {
            IO.getAsset(md5, drawMe);
        }
        function drawMe(url) {
            img.src = url;
        }
    }
}

class Events {
    static getTargetPoint(e) {
        if (isTablet) {
            if (e.touches && (e.touches.length > 0)) {
                return { x: e.touches[0].pageX, y: e.touches[0].pageY };
            } else if (e.changedTouches && (e.changedTouches.length > 0)) {
                return { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY };
            }
        }
        return { x: e.clientX, y: e.clientY };
    }
}
