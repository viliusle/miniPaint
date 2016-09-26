//http://www.dynamicdrive.com/dynamicindex1/ddsmoothmenu.htm
var ddsmoothmenu = {
    arrowimages: {
        down: ["rightarrowclass", "img/right.png", 0],
        right: ["rightarrowclass", "img/right.png", 0]
    },
    transition: {
        overtime: 0,
        outtime: 0
    }, //duration of slide in/out animation, in milliseconds
    shadow: false, //enable shadow?
    //showhidedelay:{showdelay:100,hidedelay:200}, //set delay in milliseconds before sub menus appear and disappear, respectively
    showhidedelay: {
        showdelay: 0,
        hidedelay: 0
    },
    zindexvalue: 1e3, //set z-index value for menus
    closeonnonmenuclick: true,
    closeonmouseout: false,
    overarrowre: /(?=\.(gif|jpg|jpeg|png|bmp))/i,
    overarrowaddtofilename: "_over",
    detecttouch: !!("ontouchstart" in window) || !!("ontouchstart" in document.documentElement) || !!window.ontouchstart || !!window.Touch && !!window.Touch.length || !!window.onmsgesturechange || window.DocumentTouch && window.document instanceof window.DocumentTouch,
    detectwebkit: navigator.userAgent.toLowerCase().indexOf("applewebkit") > -1,
    idevice: /ipad|iphone/i.test(navigator.userAgent),
    detectie6: function() {
        var e;
        return (e = /MSIE (\d+)/.exec(navigator.userAgent)) && e[1] < 7
    }(),
    detectie9: function() {
        var e;
        return (e = /MSIE (\d+)/.exec(navigator.userAgent)) && e[1] > 8
    }(),
    ie9shadow: function() {},
    css3support: typeof document.documentElement.style.boxShadow === "string" || !document.all && document.querySelector,
    prevobjs: [],
    menus: null,
    executelink: function(e, t, n) {
        var r = t.length,
            i = n.target;
        while (--r > -1) {
            if (t[r] === this) {
                t.splice(r, 1);
                if (i.href !== ddsmoothmenu.emptyhash && i.href && e(i).is("a") && !e(i).children("span." + ddsmoothmenu.arrowimages.down[0] + ", span." + ddsmoothmenu.arrowimages.right[0]).length) {
                    if (i.target && i.target !== "_self") {
                        window.open(i.href, i.target)
                    } else {
                        window.location.href = i.href
                    }
                    n.stopPropagation()
                }
            }
        }
    },
    repositionv: function(e, t, n, r, i, s, o) {
        o = o || 0;
        var u = 0,
            a = r + i;
        e.css({
            top: n,
            display: "block"
        });
        while (e.offset().top < i) {
            e.css({
                top: ++n
            });
            ++u
        }
        if (!u && t.offset().top + t.outerHeight() < a && e.data("height") + e.offset().top > a) {
            e.css({
                top: i - t.parents("ul").last().offset().top - t.position().top
            })
        }
        s === "toggle" && e.css({
            display: "none"
        });
        if (n !== o) {
            e.addClass("repositionedv")
        }
        return [u, n]
    },
    updateprev: function(e, t, n) {
        var r = t.length,
            i, s = n.parents().add(this);
        while (--r > -1) {
            if (s.index(i = t[r]) < 0) {
                e(i).trigger("click", [1]);
                t.splice(r, 1)
            }
        }
        t.push(this)
    },
    subulpreventemptyclose: function(e) {
        var t = e.target;
        if (t.href === ddsmoothmenu.emptyhash && $(t).parent("li").find("ul").length < 1) {
            e.preventDefault();
            e.stopPropagation()
        }
    },
    getajaxmenu: function(e, t, n) {
        var r = e("#" + t.contentsource[0]);
        r.html("Loading Menu...");
        e.ajax({
            url: t.contentsource[1],
            async: true,
            error: function(e) {
                r.html("Error fetching content. Server Response: " + e.responseText)
            },
            success: function(i) {
                r.html(i);
                !!!n && ddsmoothmenu.buildmenu(e, t)
            }
        })
    },
    closeall: function(e) {
        var t = ddsmoothmenu,
            n;
        if (!t.globaltrackopen) {
            return
        }
        if (e.type === "mouseleave" || (e.type === "click" || e.type === "touchstart") && t.menus.index(e.target) < 0) {
            n = t.prevobjs.length;
            while (--n > -1) {
                $(t.prevobjs[n]).trigger("click");
                t.prevobjs.splice(n, 1)
            }
        }
    },
    emptyhash: $('<a href="#"></a>').get(0).href,
    buildmenu: function(e, t) {
        var n = ddsmoothmenu;
        n.globaltrackopen = n.closeonnonmenuclick || n.closeonmouseout;
        var r = 0;
        var i = n.globaltrackopen ? n.prevobjs : [];
        var s = e("#" + t.mainmenuid).removeClass("ddsmoothmenu ddsmoothmenu-v").addClass(t.classname || "ddsmoothmenu");
        t.repositionv = t.repositionv !== false;
        var o = s.find(">ul");
        var u = n.detecttouch ? "toggle" : t.method === "toggle" ? "toggle" : "hover";
        var a = o.find(">li>ul").parent();
        var f = t.orientation != "v" ? "down" : "right",
            l = e(document.body);
        o.click(function(e) {
            e.target.href === n.emptyhash && e.preventDefault()
        });
        if (u === "toggle") {
            if (n.globaltrackopen) {
                n.menus = n.menus ? n.menus.add(o.add(o.find("*"))) : o.add(o.find("*"))
            }
            if (n.closeonnonmenuclick) {
                if (f === "down") {
                    s.click(function(e) {
                        e.stopPropagation()
                    })
                }
                e(document).unbind("click.smoothmenu").bind("click.smoothmenu", n.closeall);
                if (n.idevice) {
                    document.removeEventListener("touchstart", n.closeall, false);
                    document.addEventListener("touchstart", n.closeall, false)
                }
            } else if (t.closeonnonmenuclick) {
                if (f === "down") {
                    s.click(function(e) {
                        e.stopPropagation()
                    })
                }
                e(document).bind("click." + t.mainmenuid, function(e) {
                    o.find("li>a.selected").parent().trigger("click")
                });
                if (n.idevice) {
                    document.addEventListener("touchstart", function(e) {
                        o.find("li>a.selected").parent().trigger("click")
                    }, false)
                }
            }
            if (n.closeonmouseout) {
                var c = f === "down" ? s : o;
                c.bind("mouseleave.smoothmenu", n.closeall)
            } else if (t.closeonmouseout) {
                var c = f === "down" ? s : o;
                c.bind("mouseleave.smoothmenu", function() {
                    o.find("li>a.selected").parent().trigger("click")
                })
            }
            if (!e('style[title="ddsmoothmenushadowsnone"]').length) {
                e("head").append('<style title="ddsmoothmenushadowsnone" type="text/css">.ddsmoothmenushadowsnone{display:none!important;}</style>')
            }
            var h;
            e(window).bind("resize scroll", function() {
                clearTimeout(h);
                var t = o.find("li>a.selected").parent(),
                    n = e(".ddshadow").addClass("ddsmoothmenushadowsnone");
                t.eq(0).trigger("click");
                t.trigger("click");
                h = setTimeout(function() {
                    n.removeClass("ddsmoothmenushadowsnone")
                }, 100)
            })
        }
        a.each(function() {
            function p() {
                a.removeClass("selected")
            }
            var s = e(this).css({
                zIndex: (t.zindexvalue || n.zindexvalue) + r--
            });
            var o = s.children("ul:eq(0)").css({
                display: "block"
            }).data("timers", {});
            var a = s.children("a:eq(0)").css({
                paddingRight: n.arrowimages[f][2]
            }).append('<span style="display: block;" class="' + n.arrowimages[f][0] + '"></span>');
            var c = {
                w: a.outerWidth(),
                h: s.innerHeight(),
                subulw: o.outerWidth(),
                subulh: o.outerHeight()
            };
            var h = f === "down" ? c.h : 0;
            o.css({
                top: h
            });
            u === "toggle" && o.click(n.subulpreventemptyclose);
            s[u](function(r) {
                if (!s.data("headers")) {
                    n.buildsubheaders(e, o.find(">li>ul").parent(), t, u, i);
                    s.data("headers", true).find(">ul").each(function(t, n) {
                        var r = e(n);
                        r.data("height", r.outerHeight())
                    }).css({
                        display: "none",
                        visibility: "visible"
                    })
                }
                u === "toggle" && n.updateprev.call(this, e, i, s);
                clearTimeout(o.data("timers").hidetimer);
                a.addClass("selected");
                o.data("timers").showtimer = setTimeout(function() {
                    var r = f === "down" ? 0 : c.w;
                    var i = r,
                        p, d, v, m = 0;
                    r = s.offset().left + r + c.subulw > e(window).width() ? f === "down" ? -c.subulw + c.w : -c.w : r;
                    i = i !== r;
                    o.css({
                        top: h
                    }).removeClass("repositionedv");
                    if (t.repositionv && a.offset().top + h + o.data("height") > (v = e(window).height()) + (d = e(document).scrollTop())) {
                        p = (f === "down" ? 0 : a.outerHeight()) - o.data("height");
                        m = n.repositionv(o, a, p, v, d, u, h)[0]
                    }
                    o.css({
                        left: r,
                        width: c.subulw
                    }).stop(true, true).animate({
                        height: "show",
                        opacity: "show"
                    }, n.transition.overtime, function() {
                        this.style.removeAttribute && this.style.removeAttribute("filter")
                    });
                    if (i) {
                        o.addClass("repositioned")
                    } else {
                        o.removeClass("repositioned")
                    }
                    if (t.shadow) {
                        if (!s.data("$shadow")) {
                            s.data("$shadow", e("<div></div>").addClass("ddshadow toplevelshadow").prependTo(l).css({
                                zIndex: s.css("zIndex")
                            }))
                        }
                        n.ie9shadow(s.data("$shadow"));
                        var g = o.offset();
                        var y = g.left;
                        var b = g.top;
                        s.data("$shadow").css({
                            overflow: "visible",
                            width: c.subulw,
                            left: y,
                            top: b
                        }).stop(true, true).animate({
                            height: c.subulh
                        }, n.transition.overtime)
                    }
                }, n.showhidedelay.showdelay)
            }, function(t, r) {
                var a = s.data("$shadow");
                if (u === "hover") {
                    p()
                } else {
                    n.executelink.call(this, e, i, t)
                }
                clearTimeout(o.data("timers").showtimer);
                o.data("timers").hidetimer = setTimeout(function() {
                    o.stop(true, true).animate({
                        height: "hide",
                        opacity: "hide"
                    }, r || n.transition.outtime, function() {
                        u === "toggle" && p()
                    });
                    if (a) {
                        if (!n.css3support && n.detectwebkit) {
                            a.children("div:eq(0)").css({
                                opacity: 0
                            })
                        }
                        a.stop(true, true).animate({
                            height: 0
                        }, r || n.transition.outtime, function() {
                            if (u === "toggle") {
                                this.style.overflow = "hidden"
                            }
                        })
                    }
                }, n.showhidedelay.hidedelay)
            })
        })
    },
    buildsubheaders: function(e, t, n, r, i) {
        t.each(function() {
            function l() {
                a.removeClass("selected")
            }
            var t = ddsmoothmenu;
            var s = e(this).css({
                zIndex: e(this).parent("ul").css("z-index")
            });
            var o = s.children("ul:eq(0)").css({
                    display: "block"
                }).data("timers", {}),
                u;
            r === "toggle" && o.click(t.subulpreventemptyclose);
            var a = s.children("a:eq(0)").append('<span style="display: block;" class="' + t.arrowimages["right"][0] + '"></span>');
            var f = {
                w: a.outerWidth(),
                subulw: o.outerWidth(),
                subulh: o.outerHeight()
            };
            o.css({
                top: 0
            });
            s[r](function(l) {
                if (!s.data("headers")) {
                    t.buildsubheaders(e, o.find(">li>ul").parent(), n, r, i);
                    s.data("headers", true).find(">ul").each(function(t, n) {
                        var r = e(n);
                        r.data("height", r.height())
                    }).css({
                        display: "none",
                        visibility: "visible"
                    })
                }
                r === "toggle" && t.updateprev.call(this, e, i, s);
                clearTimeout(o.data("timers").hidetimer);
                a.addClass("selected");
                o.data("timers").showtimer = setTimeout(function() {
                    var i = f.w;
                    var l = i,
                        c, h, p, d = 0;
                    i = s.offset().left + i + f.subulw > e(window).width() ? -f.w : i;
                    l = l !== i;
                    o.css({
                        top: 0
                    }).removeClass("repositionedv");
                    if (n.repositionv && a.offset().top + o.data("height") > (p = e(window).height()) + (h = e(document).scrollTop())) {
                        c = a.outerHeight() - o.data("height");
                        d = t.repositionv(o, a, c, p, h, r);
                        c = d[1];
                        d = d[0]
                    }
                    o.css({
                        left: i,
                        width: f.subulw
                    }).stop(true, true).animate({
                        height: "show",
                        opacity: "show"
                    }, t.transition.overtime, function() {
                        this.style.removeAttribute && this.style.removeAttribute("filter")
                    });
                    if (l) {
                        o.addClass("repositioned")
                    } else {
                        o.removeClass("repositioned")
                    }
                    if (n.shadow) {
                        if (!s.data("$shadow")) {
                            u = s.parents("li:eq(0)").data("$shadow");
                            s.data("$shadow", e("<div></div>").addClass("ddshadow").prependTo(u).css({
                                zIndex: u.css("z-index")
                            }))
                        }
                        var v = o.offset();
                        var m = i;
                        var g = s.position().top - (c ? o.data("height") - a.outerHeight() - d : 0);
                        if (t.detectwebkit && !t.css3support) {
                            s.data("$shadow").css({
                                opacity: 1
                            })
                        }
                        s.data("$shadow").css({
                            overflow: "visible",
                            width: f.subulw,
                            left: m,
                            top: g
                        }).stop(true, true).animate({
                            height: f.subulh
                        }, t.transition.overtime)
                    }
                }, t.showhidedelay.showdelay)
            }, function(n, u) {
                var a = s.data("$shadow");
                if (r === "hover") {
                    l()
                } else {
                    t.executelink.call(this, e, i, n)
                }
                clearTimeout(o.data("timers").showtimer);
                o.data("timers").hidetimer = setTimeout(function() {
                    o.stop(true, true).animate({
                        height: "hide",
                        opacity: "hide"
                    }, u || t.transition.outtime, function() {
                        r === "toggle" && l()
                    });
                    if (a) {
                        if (!t.css3support && t.detectwebkit) {
                            a.children("div:eq(0)").css({
                                opacity: 0
                            })
                        }
                        a.stop(true, true).animate({
                            height: 0
                        }, u || t.transition.outtime, function() {
                            if (r === "toggle") {
                                this.style.overflow = "hidden"
                            }
                        })
                    }
                }, t.showhidedelay.hidedelay)
            })
        })
    },
    init: function(e) {
        function o() {
            if (s) {
                return
            }
            if (typeof e.customtheme == "object" && e.customtheme.length == 2) {
                var n = e.orientation == "v" ? t : t + ", " + t;
                i.push([n, " ul li a {background:", e.customtheme[0], ";}\n", t, " ul li a:hover {background:", e.customtheme[1], ";}"].join(""))
            }
            i.push('\n<style type="text/css">');
            i.reverse();
            jQuery("head").append(i.join("\n"))
        }
        if (this.detectie6 && parseFloat(jQuery.fn.jquery) > 1.3) {
            this.init = function(e) {
                if (typeof e.contentsource == "object") {
                    jQuery(function(t) {
                        ddsmoothmenu.getajaxmenu(t, e, "nobuild")
                    })
                }
                return false
            };
            jQuery('link[href*="ddsmoothmenu"]').attr("disabled", true);
            jQuery(function(e) {
                alert("You Seriously Need to Update Your Browser!\n\nDynamic Drive Smooth Navigational Menu Showing Text Only Menu(s)\n\nDEVELOPER's NOTE: This script will run in IE 6 when using jQuery 1.3.2 or less,\nbut not real well.");
                e('link[href*="ddsmoothmenu"]').attr("disabled", true)
            });
            return this.init(e)
        }
        var t = "#" + e.mainmenuid,
            n, r, i = ["</style>\n"],
            s = e.arrowswap ? 4 : 2;
        if (e.arrowswap) {
            n = ddsmoothmenu.arrowimages.right[1].replace(ddsmoothmenu.overarrowre, ddsmoothmenu.overarrowaddtofilename);
            r = ddsmoothmenu.arrowimages.down[1].replace(ddsmoothmenu.overarrowre, ddsmoothmenu.overarrowaddtofilename);
            jQuery(new Image).bind("load error", function(n) {
                e.rightswap = n.type === "load";
                if (e.rightswap) {
                    i.push([t, " ul li a:hover .", ddsmoothmenu.arrowimages.right[0], ", ", t, " ul li a.selected .", ddsmoothmenu.arrowimages.right[0], " { background-image: url(", this.src, ");}"].join(""))
                }--s;
                o()
            }).attr("src", n);
            jQuery(new Image).bind("load error", function(n) {
                e.downswap = n.type === "load";
                if (e.downswap) {
                    i.push([t, " ul li a:hover .", ddsmoothmenu.arrowimages.down[0], ", ", t, " ul li a.selected .", ddsmoothmenu.arrowimages.down[0], " { background-image: url(", this.src, ");}"].join(""))
                }--s;
                o()
            }).attr("src", r)
        }
        jQuery(new Image).bind("load error", function(e) {
            if (e.type === "load") {
                i.push([t + " ul li a .", ddsmoothmenu.arrowimages.right[0], " { background: url(", this.src, ") no-repeat;width:", this.width, "px;height:", this.height, "px;}"].join(""))
            }--s;
            o()
        }).attr("src", ddsmoothmenu.arrowimages.right[1]);
        jQuery(new Image).bind("load error", function(e) {
            if (e.type === "load") {
                i.push([t + " ul li a .", ddsmoothmenu.arrowimages.down[0], " { background: url(", this.src, ") no-repeat;width:", this.width, "px;height:", this.height, "px;}"].join(""))
            }--s;
            o()
        }).attr("src", ddsmoothmenu.arrowimages.down[1]);
        e.shadow = this.detectie6 && (e.method === "hover" || e.orientation === "v") ? false : e.shadow || this.shadow;
        jQuery(document).ready(function(t) {
            if (e.shadow && ddsmoothmenu.css3support) {
                t("body").addClass("ddcss3support")
            }
            if (typeof e.contentsource == "object") {
                ddsmoothmenu.getajaxmenu(t, e)
            } else {
                ddsmoothmenu.buildmenu(t, e)
            }
        })
    }
};
if (function(e) {
        var t = false;
        try {
            e('<a href="#"></a>').toggle(function() {}, function() {
                t = true
            }).trigger("click").trigger("click")
        } catch (n) {}
        return !t
    }(jQuery)) {
    (function() {
        var e = jQuery.fn.toggle;
        jQuery.extend(jQuery.fn, {
            toggle: function(t, n) {
                if (!jQuery.isFunction(t) || !jQuery.isFunction(n)) {
                    return e.apply(this, arguments)
                }
                var r = arguments,
                    i = t.guid || jQuery.guid++,
                    s = 0,
                    o = function(e) {
                        var n = (jQuery._data(this, "lastToggle" + t.guid) || 0) % s;
                        jQuery._data(this, "lastToggle" + t.guid, n + 1);
                        e.preventDefault();
                        return r[n].apply(this, arguments) || false
                    };
                o.guid = i;
                while (s < r.length) {
                    r[s++].guid = i
                }
                return this.click(o)
            }
        })
    })()
}
if (ddsmoothmenu.detectie9) {
    (function(e) {
        function t(e, t) {
            return parseInt(e) + t + "px"
        }
        ddsmoothmenu.ie9shadow = function(n) {
            var r = document.defaultView.getComputedStyle(n.get(0), null),
                i = r.getPropertyValue("box-shadow").split(" "),
                s = {
                    top: r.getPropertyValue("margin-top"),
                    left: r.getPropertyValue("margin-left")
                };
            e("head").append(['\n<style title="ie9shadow" type="text/css">', ".ddcss3support .ddshadow {", "	box-shadow: " + t(i[0], 1) + " " + t(i[1], 1) + " " + i[2] + " " + i[3] + ";", "}", ".ddcss3support .ddshadow.toplevelshadow {", "	opacity: " + (e(".ddcss3support .ddshadow").css("opacity") - .1) + ";", "	margin-top: " + t(s.top, -1) + ";", "	margin-left: " + t(s.left, -1) + ";", "}", "</style>\n"].join("\n"));
            ddsmoothmenu.ie9shadow = function() {}
        };
        var n = e.fn.height,
            r = e.fn.width;
        e.extend(e.fn, {
            height: function() {
                var e = this.get(0);
                if (this.length < 1 || arguments.length || e === window || e === document) {
                    return n.apply(this, arguments)
                }
                return parseFloat(document.defaultView.getComputedStyle(e, null).getPropertyValue("height"))
            },
            innerHeight: function() {
                if (this.length < 1) {
                    return null
                }
                var e = this.height(),
                    t = this.get(0),
                    n = document.defaultView.getComputedStyle(t, null);
                e += parseInt(n.getPropertyValue("padding-top"));
                e += parseInt(n.getPropertyValue("padding-bottom"));
                return e
            },
            outerHeight: function(e) {
                if (this.length < 1) {
                    return null
                }
                var t = this.innerHeight(),
                    n = this.get(0),
                    r = document.defaultView.getComputedStyle(n, null);
                t += parseInt(r.getPropertyValue("border-top-width"));
                t += parseInt(r.getPropertyValue("border-bottom-width"));
                if (e) {
                    t += parseInt(r.getPropertyValue("margin-top"));
                    t += parseInt(r.getPropertyValue("margin-bottom"))
                }
                return t
            },
            width: function() {
                var e = this.get(0);
                if (this.length < 1 || arguments.length || e === window || e === document) {
                    return r.apply(this, arguments)
                }
                return parseFloat(document.defaultView.getComputedStyle(e, null).getPropertyValue("width"))
            },
            innerWidth: function() {
                if (this.length < 1) {
                    return null
                }
                var e = this.width(),
                    t = this.get(0),
                    n = document.defaultView.getComputedStyle(t, null);
                e += parseInt(n.getPropertyValue("padding-right"));
                e += parseInt(n.getPropertyValue("padding-left"));
                return e
            },
            outerWidth: function(e) {
                if (this.length < 1) {
                    return null
                }
                var t = this.innerWidth(),
                    n = this.get(0),
                    r = document.defaultView.getComputedStyle(n, null);
                t += parseInt(r.getPropertyValue("border-right-width"));
                t += parseInt(r.getPropertyValue("border-left-width"));
                if (e) {
                    t += parseInt(r.getPropertyValue("margin-right"));
                    t += parseInt(r.getPropertyValue("margin-left"))
                }
                return t
            }
        })
    })(jQuery)
}

ddsmoothmenu.init({
    mainmenuid: "main_menu",
    method: 'toggle', //'hover' (default) or 'toggle'
    contentsource: "markup",
});