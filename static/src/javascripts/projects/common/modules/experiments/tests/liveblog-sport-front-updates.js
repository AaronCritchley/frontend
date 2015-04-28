define([
    'common/utils/config'
], function (
    config
) {

    return function () {
        this.id = 'LiveblogSportFrontUpdates';
        this.start = '2015-04-27';
        this.expiry = '2015-05-27';
        this.author = 'Stephan Fowler';
        this.description = 'Checking effect of showing the latest liveblog blocks on sport & fronts';
        this.audience = 0.2;
        this.audienceOffset = 0.5;
        this.successMeasure = '';
        this.audienceCriteria = 'Front visitors';
        this.dataLinkNames = '';
        this.idealOutcome = 'Higher engagement, measured as increased onward journeys to content on the affected front, or increased dewll time on that front';

        this.canRun = function () {
            var section = config.page.section;

            return (config.page.contentType === 'Section') && (section === 'sport' || section === 'football');
        };

        this.variants = [
            {
                id: 'control',
                test: function () {}
            },
            {
                id: 'updates',
                test: function () {}
            }
        ];
    };

});
