(function (window, $) {
    "use strict"; // Start of use strict
    var $movies = $('#movies .container');
    var $movieTemplate = $('.movie-template');
    var imageUrl300x450 = 'https://image.tmdb.org/t/p/w300_and_h450_bestv2/';

    $.get('https://api.themoviedb.org/3/discover/movie?api_key=23e5c00662ea37a7cf7ac130fc77badc' +
        '&language=en-US' +
        '&certification_country=US' +
        '&certification.lte=PG-13' +
        '&sort_by=popularity.desc' +
        '&include_adult=false' +
        '&include_video=true' +
        '&page=1' +
        '&primary_release_date.gte=2019-03-01',
        function (res) {
            if (res && res.results) {
                var $row = $('.row', $movies);
                res.results.forEach(function (movie) {
                    var movieDescId = 'movie-desc-' + movie.id;
                    var $card = $movieTemplate.clone().removeClass('movie-template d-none').addClass('movie');
                    $('.card-title', $card).text(movie.title);
                    $('.card-img-top', $card).attr('src', imageUrl300x450 + movie.poster_path).attr('alt', movie.title);
                    $('#movie-desc', $card).attr('id', movieDescId)
                    $('#' + movieDescId + ' .card-text', $card).text(movie.overview);
                    $('.movie-desc-toggle', $card).attr('href', '#' + movieDescId).attr('aria-controls', movieDescId);
                    $row.append($card);

                });
            }
        });

    $('footer #year').text(new Date().getFullYear());

    $('body').on('shown.bs.collapse', '.movie-desc', function () {
        console.log(this);
        var $this = $(this);
        $('.movie-desc-toggle', $this.parent()).text('Show less');
    }).on('hidden.bs.collapse', '.movie-desc', function () {
        var $this = $(this);
        $('.movie-desc-toggle', $this.parent()).text('Show more');
    });
})(window, jQuery);