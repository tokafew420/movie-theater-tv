(function (window, $) {
    'use strict';
    var $movies = $('#movies .container');
    var $movieTemplate = $('.movie-template');
    var $trailerTemplate = $('.trailer-template');
    var imageUrl300x450 = 'https://image.tmdb.org/t/p/w300_and_h450_bestv2/';
    var date = new Date();
    var dateStamp = date.toISOString().split('T')[0];
    var gapiDeferred = $.Deferred();

    gapi.load('client', function () {
        gapi.client.setApiKey('AIzaSyDbyVw9QxWoa8TxxytjrUUWtSRkAT7T1Cw');
        return gapi.client.load('https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest')
            .then(function () {
                console.log('GAPI client loaded for API');
                gapiDeferred.resolve(gapi.client);
            }, function (err) {
                console.error('Error loading GAPI client for API', err);
                gapiDeferred.reject(err);
            });
    });

    function tryParseJson(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    }

    var cache = (function (storage) {
        return {
            get: function (key, done) {
                var deferred = $.Deferred();
                var data = storage.getItem(key);

                if (data === null) {
                    done(function (err, res) {
                        if (err) {
                            console.log(err);
                            return deferred.reject(err);
                        }
                        storage.setItem(key, JSON.stringify(res));
                        return deferred.resolve(res);
                    });
                } else {
                    deferred.resolve(tryParseJson(data));
                }

                return deferred;
            },
            set: function (key, data) {
                storage.setItem(key, JSON.stringify(data));
            }
        };
    })(window.sessionStorage);

    cache.get('movie-list-' + dateStamp, function (done) {
        var releaseDate = new Date(new Date(date).setMonth(date.getMonth() - 3)).toISOString().split('T')[0];
        $.get('https://api.themoviedb.org/3/discover/movie?api_key=23e5c00662ea37a7cf7ac130fc77badc' +
                '&language=en-US' +
                '&certification_country=US' +
                '&certification.lte=PG-13' +
                '&sort_by=release_date.desc' +
                '&include_adult=false' +
                '&include_video=true' +
                '&page=1' +
                '&primary_release_date.gte=' + releaseDate)
            .always(function (res) {
                done(null, res);
            });
    }).then(function (res) {
        if (res && res.results) {
            var $row = $('.row', $movies);
            res.results.forEach(function (movie) {
                var movieDescId = 'movie-desc-' + movie.id;
                var $card = $movieTemplate.clone().removeClass('movie-template d-none').addClass('movie');
                $('.card-title', $card).text(movie.title);
                $('.card-img-top', $card).attr('src', imageUrl300x450 + movie.poster_path).attr('alt', movie.title);
                $('#movie-desc', $card).attr('id', movieDescId);
                $('#' + movieDescId + ' .card-text', $card).text(movie.overview);
                $('.movie-desc-toggle', $card).attr('href', '#' + movieDescId).attr('aria-controls', movieDescId);
                $row.append($card);

                // Get Trailers
                gapiDeferred.then(function () {
                    cache.get('trailer-' + movie.id, function (done) {
                        gapi.client.youtube.search.list({
                                part: 'snippet',
                                channelId: 'UCi8e0iOVk1fEOogdfu4YgfA',
                                order: 'relevance',
                                q: movie.title + ' trailer',
                                safeSearch: 'moderate',
                                type: 'video',
                                videoEmbeddable: 'true'
                            })
                            .then(function (res) {
                                done(null, res);
                            }, function (err) {
                                console.error('Execute error', err);
                                done(err);
                            });
                    }).then(function (res) {
                        console.log('Response', res);
                        if (res && res.result && res.result.items) {
                            res.result.items.forEach(function (result) {
                                var match = result.snippet.title.match(new RegExp(movie.title + ' trailer #(\\d).*', 'i'));
                                var num = match && +match[1];
                                if (!isNaN(num) && num > 0) {
                                    console.log('Passed: ' + result.snippet.title);
                                    var $trailer = $trailerTemplate.clone().removeClass('trailer-template d-none').addClass('trailer');
                                    $trailer.attr('data-video-id', result.id.videoId)
                                    $trailer.html('<img src="' + result.snippet.thumbnails.default.url + '" width="" height=""></img>')
                                    $('.trailers .row', $card).append($trailer);
                                } else {
                                    console.log('Failed: ' + result.snippet.title);
                                }
                            });
                        }
                    });
                })
            });
        }
    });

    var $modal = $('.trailer-modal');
    $modal.on('hidden.bs.modal', function () {
        $('iframe', $modal).attr('src', '');
    });

    $('#movies .container').on('click', '.trailer', function () {
        var $trailer = $(this);
        var videoId = $trailer.attr('data-video-id');

        $('iframe', $modal).attr('src', 'https://www.youtube.com/embed/' + videoId);

        $modal.modal('show');
    });

    $('footer #year').text(date.getFullYear());

    $('body').on('shown.bs.collapse', '.movie-desc', function () {
        console.log(this);
        var $this = $(this);
        $('.movie-desc-toggle', $this.parent()).text('Show less');
    }).on('hidden.bs.collapse', '.movie-desc', function () {
        var $this = $(this);
        $('.movie-desc-toggle', $this.parent()).text('Show more');
    });
})(window, jQuery);