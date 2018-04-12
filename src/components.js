export default (editor, config = {}) => {
    const domc = editor.DomComponents;
    const videoType = domc.getType('video');

    const videoModel = videoType.model;
    const videoView = videoType.view;
    // ...

    let defaults = videoModel.prototype.defaults;
    defaults.svUrl = `//videos.sproutvideo.com/embed/`;
    defaults.videoId2 = ``;

    let model = videoModel.extend({
        // Extend default properties
        defaults: defaults,

        initialize: function (o, opt) {
            videoModel.prototype.initialize.apply(this, [o, opt])
            var traits = [];
            var prov = this.get('provider');
            switch (prov) {
                case 'sv':
                    traits = this.getSproutVideoTraits();
                    if (this.get('src'))
                        this.parseFromSrc();
                    this.set('traits', traits);
                    break;
            }
        },

        parseFromSrc: function () {
            videoModel.prototype.parseFromSrc.apply(this);

            var prov = this.get('provider');
            var uri = this.parseUri(this.get('src'));
            var qr = uri.query;
            switch (prov) {
                case 'sv':
                    var videoId2 = uri.pathname.split('/').pop();
                    var videoId1 = uri.pathname.split('/').pop();
                    this.set('videoId', videoId1);
                    this.set('videoId2', videoId2);
                    try {
                        this.set('autoplay', JSON.parse(qr.autoplay) === true);
                    } catch (e) {
                        this.set('autoplay', false);
                    }

                    try {
                        this.set('loop', JSON.parse(qr.loop) === true);

                    } catch (e) {
                        this.set('loop', false);
                    }

                    try {
                        this.set('controls', JSON.parse(qr.bigPlayButton) === false);

                    } catch (e) {
                        this.set('controls', true);
                    }

                    break;
                default:
            }
        },

        updateSrc: function () {
            videoModel.prototype.updateSrc.apply(this);
            var prov = this.get('provider');
            switch (prov) {
                case 'sv':
                    this.set('src', this.getSproutVideoSrc());
                    break;
            }
        },

        getAttrToHTML: function (...args) {
            var attr = videoModel.prototype.getAttrToHTML.apply(this, args);
            var prov = this.get('provider');
            switch (prov) {
                case 'sv':
                    delete attr.loop;
                    delete attr.autoplay;
                    delete attr.controls;
                default:
                    break;
            }
            return attr;
        },

        updateTraits: function () {
            var prov = this.get('provider');
            var traits = this.getSourceTraits();
            switch (prov) {
                case 'yt':
                    this.set('tagName', 'iframe');
                    traits = this.getYoutubeTraits();
                    break;
                case 'vi':
                    this.set('tagName', 'iframe');
                    traits = this.getVimeoTraits();
                    break;
                case 'sv':
                    this.set('tagName', 'iframe');
                    traits = this.getSproutVideoTraits();
                    break;
                default:
                    this.set('tagName', 'video');
            }
            this.loadTraits(traits);
            this.em.trigger('change:selectedComponent');
        },

        getProviderTrait: function () {
            let options = videoModel.prototype.getProviderTrait.apply(this);

            const svOption = {value: 'sv', name: 'Sprout Video'};

            options.options.push(svOption);

            return options;
        },

        getSproutVideoTraits: function () {
            return [
                this.getProviderTrait(),
                {
                    label: 'Video ID',
                    name: 'videoId',
                    placeholder: 'eg. 01234/56789',
                    changeProp: 1
                },
                this.getAutoplayTrait(),
                this.getLoopTrait(),
                this.getControlsTrait()
            ];
        },

        getSproutVideoSrc: function () {
            var url = `${this.get('svUrl')}${this.get('videoId')}/${this.get('videoId2')}?`;
            url += this.get('autoplay') ? 'autoPlay=true' : '';
            url += this.get('controls') ? '&bigPlayButton=false' : '';
            url += this.get('loop') ? '&loop=true' : '';
            return url;
        }
    }, {
        isComponent: function (el) {
            var result = '';
            var isYtProv = /youtube\.com\/embed/.test(el.src);
            var isViProv = /player\.vimeo\.com\/video/.test(el.src);
            var isSvProv = /videos\.sproutvideo\.com\/embed/.test(el.src);
            var isExtProv = isYtProv || isViProv || isSvProv;
            if (el.tagName === 'VIDEO' || (el.tagName === 'IFRAME' && isExtProv)) {
                result = {type: 'video'};
                if (el.src)
                    result.src = el.src;
                if (isExtProv) {
                    if (isYtProv)
                        result.provider = 'yt';
                    else if (isViProv)
                        result.provider = 'vi';
                    else if (isSvProv)
                        result.provider = 'sv';
                }
            }
            return result;
        }
    });

    let view = videoView.extend({
        updateSrc: function () {
            videoView.prototype.updateSrc.apply(this);
            var prov = this.model.get('provider');
            var src = this.model.get('src');
            switch (prov) {
                case 'sv':
                    src = this.model.getSproutVideoSrc();
                    break;
            }
            this.videoEl.src = src;
        },

        updateVideo: function () {
            videoView.prototype.updateVideo.apply(this);
            var prov = this.model.get('provider');
            var md = this.model;
            switch (prov) {
                case 'sv':
                    this.model.trigger('change:videoId');
                    break;
            }
        },

        renderByProvider: function (prov) {
            var videoEl = videoView.prototype.renderByProvider.apply(this, [prov]);
            if (prov === 'sv') {
                videoEl = this.renderSproutVideo();
            }
            this.videoEl = videoEl;
            return videoEl;
        },

        renderSproutVideo: function () {
            var el = document.createElement('iframe');
            el.src = this.model.getSproutVideoSrc();
            el.frameBorder = 0;
            el.setAttribute('allowfullscreen', true);
            this.initVideoEl(el);
            return el;
        }
    });

    domc.addType('video', {
        model: model,
        view: view
    });
}
