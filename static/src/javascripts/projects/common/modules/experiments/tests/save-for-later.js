define([
    'bonzo',
    'qwery',
    'common/utils/detect',
    'common/utils/config',
    'common/utils/mediator',
    'common/modules/loyalty/save-for-later'
], function (
    bonzo,
    qwery,
    detect,
    config,
    mediator,
    SaveForLater
) {

    return function () {
        this.id = 'SaveForLater';
        this.start = '2015-04-09';
        this.expiry = '2015-07-09';
        this.author = 'Nathaniel Bennett';
        this.description = 'Internal test of save for later functionality';
        this.audience = 0.0;
        this.audienceOffset = 0;
        this.successMeasure = '';
        this.audienceCriteria = 'Interal only - we opt in';
        this.dataLinkNames = '';
        this.idealOutcome = '';
        this.showForSensitive = false;

        this.canRun = function () {
            return !/Network Front|Section/.test(config.page.contentType);
        };

        this.variants = [
            {
                id: 'variant',
                test: function () {
                    mediator.on('module:identity:api:loaded', function () {
                        var saveForLater = new SaveForLater();
                        saveForLater.init();
                    });

                    mediator.on('modules:profilenav:loaded', function () {
                        var popup = qwery('.popup--profile')[0];
                        bonzo(popup).append(bonzo.create(
                            '<li class="popup__item">' +
                            '<a href="' + config.page.idUrl + '/prefs/saved-content" class="brand-bar__item--action" data-link-name="Saved for Later">Saved for later</a>' +
                            '</li>'
                        ));
                    });

                }
            }
        ];
    };
});
