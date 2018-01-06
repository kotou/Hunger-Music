    var EventCenter = {
        on: function (type, handler) {
            $(document).on(type, handler)
        },
        fire: function (type, data) {
            $(document).trigger(type, data)
        }
    }
    var Footer = {
        init: function () {
            this.$footer = $('.lower')
            this.$ul = this.$footer.find('ul')
            this.$menu = this.$footer.find('.menu')
            this.$left = this.$footer.find('.icon-left')
            this.$right = this.$footer.find('.icon-right')
            this.isLast = false
            this.isAnimate = true
            this.isStart = false
            this.render()
            this.bind()
        },
        bind: function () {
            var _this = this
            this.$footer.on('click', 'li', function () {
                $(this).addClass('active').siblings().removeClass('active')
                EventCenter.fire('switch', {
                    classifyId: $(this).attr('classify-id'),
                    classifyName: $(this).attr('classify-name')
                })
            })

            this.$right.on('click', function () {
                if (!_this.isAnimate) return
                var liWidth = _this.$ul.find('li').outerWidth(true)
                var menuWidth = _this.$menu.width()
                if (!_this.isLast) {
                    _this.isAnimate = false
                    _this.$ul.animate({
                        left: '-=' + Math.floor(menuWidth / liWidth) * liWidth
                    }, 500, function () {
                        _this.isAnimate = true
                        _this.isStart = false
                        if (parseFloat(_this.$menu.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                            _this.isLast = true
                        }
                    })
                }
            })

            this.$left.on('click', function () {
                if (!_this.isAnimate) return
                var liWidth = _this.$ul.find('li').outerWidth(true)
                var menuWidth = _this.$menu.width()
                if (!_this.isStart) {
                    _this.isAnimate = false
                    _this.$ul.animate({
                        left: '+=' + Math.floor(menuWidth / liWidth) * liWidth
                    }, 500, function () {
                        _this.isAnimate = true
                        _this.isLast = false
                        if (parseFloat(_this.$ul.css('left')) >= 0) {
                            _this.isStart = true
                        }
                    })
                }
            })
        },
        render: function () {
            var _this = this
            $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
                .done(function (result) {
                    _this.up(result)
                }).fail(function () {
                alert('error')
            })
        },
        up: function (data) {
            var _this = this
            data.channels.forEach(function (term) {
                var tpl = '<li>\
            <div class="nav" style="background-image:url(//cloud.hunger-valley.com/17-10-24/1906806.jpg-small)"></div>\
            <h3>我的收藏</h3>\
            </li>'
                var $node = $(tpl)
                $node.attr('classify-id', term.channel_id)
                $node.attr('classify-name', term.name)
                $node.find('.nav').css('background-image', "url(" + term.cover_small + ")")
                $node.find('h3').text(term.name)
                _this.$ul.append($node)
            })
            this.addWidth()
        },
        addWidth: function () {
            var number = this.$footer.find('li').length
            var width = this.$footer.find('li').outerWidth(true)
            this.$ul.css({
                width: number * width + 'px'
            })
        }
    }

    var FM = {
        init: function () {
            this.audio = new Audio()
            this.$panel = $('.panel')
            this.$main = this.$panel.find('main')
            this.$box = this.$main.find('.box')
            this.$content = this.$main.find('.content')
            this.$screen = $('.screen')
            this.$the = $('.the')
            this.$songster = $('.songster')
            this.$hour = $('.hour')
            this.$speed = $('.speed')
            this.$cover = $('.front-cover')
            this.$lyr = $('.lyr')
            this.audio.autoplay = true
            this.song = null
            this.index = 0
            this.collection = this.found()
            this.timer
            this.bind()

            EventCenter.fire('switch', {
                classifyId: '0',
                classifyName: '我的收藏'
            })
        },
        bind: function () {
            var _this = this
            EventCenter.on('switch', function (e, data) {
                _this.classifyId = data.classifyId
                _this.classifyName = data.classifyName
                _this.loadMusic()
            })

            this.$box.find('.state').on('click', function () {
                if ($(this).hasClass('icon-play')) {
                    $(this).removeClass('icon-play').addClass('icon-pause')
                    _this.audio.play()
                } else {
                    $(this).removeClass('icon-pause').addClass('icon-play')
                    _this.audio.pause()
                }
            })

            this.$box.find('.next').on('click', function () {
                if (_this.classifyId === "0") {
                    _this.index += 1
                    _this.loadCollection()
                } else {
                    _this.loadMusic()
                }
            })

            this.audio.addEventListener('play', function () {
                _this.clock = setInterval(function () {
                    _this.update()
                }, 1000)
            })

            this.audio.addEventListener('pause', function () {
                clearInterval(_this.clock)
            })

            this.audio.addEventListener('ended', function () {
                _this.loadMusic()
            })

            this.$content.find('.bar').on('click', function (e) {
                var percentage = e.offsetX / parseInt($(this).css('width'))
                _this.audio.currentTime = _this.audio.duration * percentage
            })

            this.$box.find('.heart').on('click', function () {
                var $event = $(this)
                if ($event.hasClass('collect')) {
                    $event.removeClass('collect')
                    delete _this.collection[_this.song.sid]
                } else {
                    $event.addClass('collect')
                    _this.collection[_this.song.sid] = _this.song
                }
                _this.addto()
            })

            this.$panel.on('mousemove', function () {
                if (_this.timer) {
                    clearTimeout(_this.timer)
                }
                _this.timer = setInterval(function () {
                    _this.$screen.css('display', 'block')
                    _this.$panel.css('display', 'none')
                }, 300000)
            })

            this.$screen.on('mousemove', function () {
                _this.$panel.css('display', 'block')
                _this.$screen.css('display', 'none')
            })
        },
        loadMusic() {
            var _this = this
            if (_this.classifyId === "0") {
                _this.loadCollection()
            } else {
                $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', {channel: _this.classifyId}).done(function (result) {
                    _this.isPlay(result.song[0])
                })
            }
        },
        isPlay: function (song) {
            this.song = song
            this.audio.src = song.url
            $('.backdrop').css('background-image', "url(" + song.picture + ")")
            this.$cover.css('background-image', "url(" + song.picture + ")")
            this.$content.find('.sum').text(this.classifyName)
            this.$the.text(song.title)
            this.$songster.text(song.artist)
            this.$box.find('.state').removeClass('icon-play').addClass('icon-pause')
            var hear = Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000
            var like = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000
            var praise = Math.floor(Math.random() * (8000 - 1000 + 1)) + 1000
            this.$content.find('.hear').text(hear)
            this.$content.find('.like').text(like)
            this.$content.find('.praise').text(praise)
            if (this.collection[song.sid]) {
                this.$box.find('.heart').addClass('collect')
            } else {
                this.$box.find('.heart').removeClass('collect')
            }
            this.isLyric()
        },
        update: function () {
            var _this = this
            var minute = Math.floor(this.audio.currentTime / 60)
            var second = Math.floor(this.audio.currentTime) % 60 + ''
            second = second.length === 2 ? second : '0' + second
            this.$hour.text(minute + ':' + second)
            this.$speed.css('width', (this.audio.currentTime / this.audio.duration) * 100 + '%')
            if (this.lyricObj !== undefined) {
                var line = this.lyricObj['0' + minute + ':' + second]
                if (line) {
                    _this.$lyr.find('p').text(line).boomText()
                }
            }
        },
        isLyric: function () {
            var _this = this
            $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php', {sid: this.song.sid})
                .done(function (result) {
                    var lyricObj = {}
                    result.lyric.split('\n').forEach(function (line) {
                        var times = line.match(/\d{2}:\d{2}/g)
                        var str = line.replace(/\[.+?\]/g, '')
                        if (Array.isArray(times)) {
                            times.forEach(function (time) {
                                lyricObj[time] = str
                            })
                        }
                    })
                    _this.lyricObj = lyricObj
                })
        },
        found: function () {
            return JSON.parse(localStorage['collection'] || '{}')
        },
        addto: function () {
            localStorage['collection'] = JSON.stringify(this.collection)
        },
        loadCollection: function () {
            var _this = this
            var keyArr = Object.keys(this.collection)
            if (keyArr.length === 0) return
            if (this.index == keyArr.length) {
                _this.index = 0
            }
            var collectionSid = keyArr[this.index]
            this.isPlay(this.collection[collectionSid])
        }
    }

    $.fn.boomText = function (type) {
        type = type || 'rollIn'
        this.html(function () {
            var arr = $(this).text()
                .split('').map(function (word) {
                    return '<span class="boomText" style="opacity:0;display:inline-block">' + word + '</span>'
                })
            return arr.join('')
        })

        var index = 0
        var $boomTexts = $(this).find('span')
        var clock = setInterval(function () {
            $boomTexts.eq(index).addClass('animated ' + type)
            index++
            if (index >= $boomTexts.length) {
                clearInterval(clock)
            }
        }, 300)
    }
    Footer.init()
    FM.init()
