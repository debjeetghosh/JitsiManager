
var csrftoken = Cookies.get('csrftoken');

// ajax submission
function safeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

var formData;
// var $formWrapper = $(".file-drop-wrapper");
var imageFiles = [];
var droppedFiles;
var submitButton = $('.btn-submit');
var preloader = $('.preloader');
var documentBody = $("body");
var newPreviewImageClass = ".new__image";
var existingImage = $(".old-image");
var imagePreview = $('.image__preview');
var maxNumberOfimage = 3;
var maxFileSize = 2 * 1024 * 1000;

var albumImagePreview = $('.album__image__preview');
var albumFormElement = $('#album_create');
var $albumForm = albumFormElement;
var albumImageFiles = [];



function disableSubmitOnEnter() {
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });
}

function defaultInitMap() {
    var id_lat = 'id_lat';
    var id_long = 'id_long';
    var mapId = 'map';
    var removeBtnId = mapId + '-remove-tag';
    var searchInputId = mapId + '-google-map-search';
    initMap(mapId, id_lat, id_long, removeBtnId, searchInputId);
}

function initHometownMap() {
    var id_lat = 'id_hometown_lat';
    var id_long = 'id_hometown_long';
    var mapId = 'hometown-map';
    var removeBtnId = mapId + '-remove-tag';
    var searchInputId = mapId + '-google-map-search';
    initMap(mapId, id_lat, id_long, removeBtnId, searchInputId);
}

function initCurrentCityMap() {
    var id_lat = 'id_current_city_lat';
    var id_long = 'id_current_city_long';
    var mapId = 'current-city-map';
    var removeBtnId = mapId + '-remove-tag';
    var searchInputId = mapId + '-google-map-search';
    initMap(mapId, id_lat, id_long, removeBtnId, searchInputId);
}

function initBusinessCityMap() {
    try {
        var id_lat = 'id_latitude';
        var id_long = 'id_longitude';
        var mapId = 'business-city-map';
        var removeBtnId = mapId + '-remove-tag';
        var searchInputId = mapId + '-google-map-search';
        initMap(mapId, id_lat, id_long, removeBtnId, searchInputId);
    } catch (err) {
        console.log(err)
    }
}

function peopleInitMap() {
    initHometownMap();
    initCurrentCityMap();
}


function copyToClipboard(element, attr) {
    var text = element.attr(attr).toString();
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}

function initMap(mapId, id_lat, id_long, removeBtnId, searchInputId) {
    var map;
    var markers = [];
    var lat_ele = document.getElementById(id_lat);
    var long_ele = document.getElementById(id_long);
    var lat = parseFloat(lat_ele.value);
    var long = parseFloat(long_ele.value);
    var has_latlong = true;

    if (!(lat && long)) {
        lat = 23.7806759;
        long = 90.3492454;
        has_latlong = false;
    }

    console.log(mapId, id_lat, id_long, removeBtnId, searchInputId, lat, long)

    map = new google.maps.Map(document.getElementById(mapId), {
        center: {lat: lat, lng: long},
        zoom: 10,
        mapTypeId: 'roadmap'
    });

    if (has_latlong) {
        addMarker({lat: lat, lng: long});
        $("#" + removeBtnId).show();
    }

    // Create the search box and link it to the UI element.
    var input = document.getElementById(searchInputId);
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }

            lat_ele.value = place.geometry.location.lat();
            long_ele.value = place.geometry.location.lng();
        });
        map.fitBounds(bounds);
        $("#" + removeBtnId).show();
    });

    //On click map sets new marker
    google.maps.event.addListener(map, 'click', function (event) {
        deleteMarkers();
        addMarker(event.latLng);
        lat_ele.value = event.latLng.lat();
        long_ele.value = event.latLng.lng();
        $("#" + removeBtnId).show();
    });

    // Adds a marker to the map and push to the array.
    function addMarker(location) {
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });
        markers.push(marker);
    }

    // Sets the map on all markers in the array.
    function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }

    // Removes the markers from the map, but keeps them in the array.
    function clearMarkers() {
        setMapOnAll(null);
    }

    // Shows any markers currently in the array.
    function showMarkers() {
        setMapOnAll(map);
    }

    // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
        clearMarkers();
        markers = [];
    }

    $("#" + removeBtnId).click(function () {
        deleteMarkers();
        lat_ele.value = null;
        long_ele.value = null;
        $("#" + removeBtnId).hide();
    });

    disableSubmitOnEnter();
}

function showMap() {
    var map;
    var lat = parseFloat(document.getElementById('id_lat').value);
    var long = parseFloat(document.getElementById('id_long').value);

    if (lat && long) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: lat, lng: long},
            zoom: 15,
            mapTypeId: 'roadmap'
        });

        new google.maps.Marker({
            position: {lat: lat, lng: long},
            map: map
        });
    }
}

function insertImageArticleForm() {
    var imgUrl = $('#id_image').val();
    var imgEle = $('#form-img img').first();
    var bannerImgUrl = $('#id_banner_image').val();
    var bannerImgEle = $('#form-banner-img img').first();
    imgEle.attr('src', imgUrl);
    bannerImgEle.attr('src', bannerImgUrl);
}

function showImageOnArticleForm() {
    $('#id_image').closest('.form-group').append($('<div id="form-img" class="mt10"><img src=""/></div>'));
    $('#id_banner_image').closest('.form-group').append($('<div id="form-banner-img" class="mt10"><img src=""/></div>'));
    insertImageArticleForm();
    $('#id_image').on('blur', function (e) {
        insertImageArticleForm();
    });
    $('#id_banner_image').on('blur', function (e) {
        insertImageArticleForm();
    })
}




/**
 * Album and gallery
 */

function removeFile(e) {
    var imageElement = $(this).parent().find('img');
    var file = imageElement.data("file");
    imageFiles = imageFiles.filter(function (obj) {
        return obj.name !== file;
    });
    var parentElement = $(this).parent().closest('.col-md-3').first();
    $(this).parent().remove();
    parentElement.remove();
}

function handleAlbumForm(e) {
    e.preventDefault();
    //console.log(imageFiles);
    // console.log(e.target);
    formData = new FormData($albumForm.get(0));
    formData.delete('images');
    imageFiles.forEach(function (f) {
        console.log(f);
        formData.append('images', f);
    });
    $.each($(".album-caption").get().reverse(), function (k, v) {
        console.log($(v).val());
        formData.append('caption', $(v).val());
    });

    var buttonContents = [];
    var btn = $albumForm.find('input[type=submit]');
    $('#form-save-loader').show();

    $.each(btn, function (i, elm) {
        var btnContent = $(elm).html();
        buttonContents.push($(elm).html());
        $(elm).prop('disabled', true).html('loading...');
    });


    $.ajax({
        url: ".",
        method: "POST",
        data: formData,
        success: function (response) {
            $('#form-save-loader').hide();
            //btn.prop('disabled', false).html(btnContent);
            if (response.success) {
                console.log('success', response);
                window.location.href = response.redirect_to;
            }
            else {
                console.log('error', response);
                var errKeys = Object.keys(response.errors);
                var errMessage = "";
                errKeys.forEach(function (er) {
                    errMessage += "<p>" + er.toUpperCase() + " : ";
                    response.errors[er].forEach(function (msg) {
                        errMessage += msg + " "
                    });
                    errMessage += "</p>";
                });
                $.Alert({type: 'danger', text: errMessage});
                btn.prop('disabled', false).html(btnContent);
            }
        },
        beforeSend: function (xhr, settings) {
            if (!safeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        },
        error: function (data) {
        },
        xhr: function () {
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    console.log(percentComplete);
                    preloader.find('.count').text(percentComplete);
                    if (percentComplete === 1) {
                        //progressBar.addClass('hide');
                        preloader.addClass('gone');
                    }
                }
            }, false);
            xhr.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    console.log(percentComplete);
                    preloader.find('count').text(percentComplete);
                }
            }, false);
            return xhr;
        },
        complete: function (jqXHR, textStatus) {
            console.log(jqXHR, textStatus);
            $('.preloader').fadeOut(3000, function () {
                this.remove();
            });
        },
        dataType: 'json',
        processData: false,
        contentType: false
    });

}

function handleAlbumFileSelect(e, inputFiles) {

    var files = inputFiles ? inputFiles : e.target.files;
    maxNumberOfimage = 10;
    if (imageFiles.length > maxNumberOfimage) {
        // alert('You can not upload more then 3.');
        $.Alert({type: 'danger', text: 'You can not upload more then ' + maxNumberOfimage + ' files.'});
    }
    else {
        var filesArr = Array.prototype.slice.call(files);
        var fileIgnored = false;
        filesArr.forEach(function (f) {
            if (f.size > maxFileSize) {
                fileIgnored = true;
            }
            else {
                imageFiles.push(f);
            }
        });

        if (fileIgnored) {
            $.Alert({type: 'danger', text: 'Some files has ignored due to large file size (more then 2 mb)'});
        }

        //For update
        if (albumImagePreview.hasClass('existing_preview')) {
            albumImagePreview.find('*').remove();
        }

        imageFiles.forEach(function (f) {
            if (!f.type.match("image.*")) {
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                var imagePreviewHtml = $(
                    '<div class="col-md-3 mb-4 p">' +
                    '<div class="album-img">' +
                    '<div class="img-box"><img src="' + e.target.result + '" data-file="' + f.name + '" class="removeImage" title="Click to remove"></div>' +
                    '<div class="p-2"><input type="text" name="caption[]" class="album-caption form-control" placeholder="Caption"></div>' +
                    '<span class="image-remove pull-right pointer new__image" > ' +
                    '<i class="fa fa-times"></i> Remove</span>' +
                    '</div></div>'
                );

                var x = $("img[src$='" + e.target.result + "']");
                if (x.length < 1) {
                    albumImagePreview.prepend(imagePreviewHtml);
                }
            };
            reader.readAsDataURL(f);
        });
    }
}

function deleteImage(e) {
    e.preventDefault();
    if (confirm("Are you sure to delete?")) {
        var albumImg = $(this).closest('.album-img').first();
        var parentElement = $(albumImg).closest('.col-md-3').first();
        var imgId = $(albumImg).data("id");
        var albumId = $(albumImg).data("albumid");
        var $loader = $(this).find('.ajax-loader');
        var $delete_btn = $(this).find('.del');

        $loader.show();
        $delete_btn.hide();
        $.ajax({
            url: "/album/delete-image/" + albumId + '/' + imgId + '/',
            method: "POST",
            data: {
                'album_id': albumId,
                'id': imgId,
            },
            success: function (response) {
                //btn.prop('disabled', false).html(btnContent);
                if (response.success) {
                    console.log('success', response);
                    parentElement.remove();
                }
                else {
                    console.log('error', response);
                    var errKeys = Object.keys(response.errors);
                    var errMessage = "";
                    errKeys.forEach(function (er) {
                        errMessage += "<p>" + er.toUpperCase() + " : ";
                        response.errors[er].forEach(function (msg) {
                            errMessage += msg + " "
                        });
                        errMessage += "</p>";
                    });
                    $.Alert({type: 'danger', text: errMessage});
                }
                $loader.hide();
                $delete_btn.show();
            },
            beforeSend: function (xhr, settings) {
                if (!safeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            },
            error: function (data) {
                $loader.hide();
                $delete_btn.show();
            },
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        console.log(percentComplete);
                        preloader.find('.count').text(percentComplete);
                        if (percentComplete === 1) {
                            //progressBar.addClass('hide');
                            preloader.addClass('gone');
                        }
                    }
                }, false);
                xhr.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        console.log(percentComplete);
                        preloader.find('count').text(percentComplete);
                    }
                }, false);
                return xhr;
            },
            complete: function (jqXHR, textStatus) {
                console.log(jqXHR, textStatus);
                $('.preloader').fadeOut(3000, function () {
                    this.remove();
                });
            },
            dataType: 'json'
        });
    }
}


function saveImageCaption(e) {
    e.preventDefault();
    if (confirm("Are you sure to save?")) {
        var albumImg = $(this).closest('.album-img').first();
        var imgId = $(albumImg).data("id");
        var albumId = $(albumImg).data("albumid");
        var imgCaption = $(albumImg).find("input[name=caption_" + imgId + "]").first().val();
        var $loader = $(this).find('.ajax-loader');
        var $save_btn = $(this).find('.fa');

        $loader.show();
        $save_btn.hide();
        $.ajax({
            url: "/album/save-image/" + albumId + '/' + imgId + '/',
            method: "POST",
            data: {
                'album_id': albumId,
                'id': imgId,
                'caption': imgCaption,
            },
            success: function (response) {
                $loader.hide();
                $save_btn.show();
                if (response.success) {
                    console.log('success', response);
                }
                else {
                    console.log('error', response);
                    var errKeys = Object.keys(response.errors);
                    var errMessage = "";
                    errKeys.forEach(function (er) {
                        errMessage += "<p>" + er.toUpperCase() + " : ";
                        response.errors[er].forEach(function (msg) {
                            errMessage += msg + " "
                        });
                        errMessage += "</p>";
                    });
                    $.Alert({type: 'danger', text: errMessage});
                }
            },
            beforeSend: function (xhr, settings) {
                if (!safeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            },
            error: function (data) {
                $loader.hide();
                $save_btn.show();
            },
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        console.log(percentComplete);
                        preloader.find('.count').text(percentComplete);
                        if (percentComplete === 1) {
                            //progressBar.addClass('hide');
                            preloader.addClass('gone');
                        }
                    }
                }, false);
                xhr.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        console.log(percentComplete);
                        preloader.find('count').text(percentComplete);
                    }
                }, false);
                return xhr;
            },
            complete: function (jqXHR, textStatus) {
                console.log(jqXHR, textStatus);
                $('.preloader').fadeOut(3000, function () {
                    this.remove();
                });
            },
            dataType: 'json'
        });
    }
}


function makeCoverPhoto(e) {
    e.preventDefault();
    if (confirm("Are you sure to make it cover photo?")) {
        var albumImg = $(this).closest('.album-img').first();
        var imgId = $(albumImg).data("id");
        var albumId = $(albumImg).data("albumid");
        var imgCaption = $(albumImg).find("input[name=caption_" + imgId + "]").first().val();
        var $loader = $(this).find('.ajax-loader');
        var $save_btn = $(this).find('.fa');

        $loader.show();
        $save_btn.hide();
        $.ajax({
            url: "/album/make-cover/" + albumId + '/' + imgId + '/',
            method: "POST",
            data: {
                'album_id': albumId,
                'id': imgId,
                'caption': imgCaption,
            },
            success: function (response) {
                $loader.hide();
                $save_btn.show();
                if (response.success) {
                    console.log('success', response);
                    document.location = ""
                }
                else {
                    console.log('error', response);
                    var errKeys = Object.keys(response.errors);
                    var errMessage = "";
                    errKeys.forEach(function (er) {
                        errMessage += "<p>" + er.toUpperCase() + " : ";
                        response.errors[er].forEach(function (msg) {
                            errMessage += msg + " "
                        });
                        errMessage += "</p>";
                    });
                    $.Alert({type: 'danger', text: errMessage});
                }
            },
            beforeSend: function (xhr, settings) {
                if (!safeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            },
            error: function (data) {
                $loader.hide();
                $save_btn.show();
            },
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        console.log(percentComplete);
                        preloader.find('.count').text(percentComplete);
                        if (percentComplete === 1) {
                            //progressBar.addClass('hide');
                            preloader.addClass('gone');
                        }
                    }
                }, false);
                xhr.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        console.log(percentComplete);
                        preloader.find('count').text(percentComplete);
                    }
                }, false);
                return xhr;
            },
            complete: function (jqXHR, textStatus) {
                console.log(jqXHR, textStatus);
                $('.preloader').fadeOut(3000, function () {
                    this.remove();
                });
            },
            dataType: 'json'
        });
    }
}




$(document).ready(function () {
    $("#album_image").on("change", handleAlbumFileSelect);
    $albumForm.on('submit', handleAlbumForm);
    documentBody.on("click", newPreviewImageClass, removeFile);
    $("#update-existing-image .image-remove").on("click", deleteImage);
    $("#update-existing-image .image-save-btn").on("click", saveImageCaption);
    $("#update-existing-image .image-make-cover-btn").on("click", makeCoverPhoto);

    var csrftoken = Cookies.get('csrftoken');

});







$().ready(function () {

    //
    // setTimeout(function () {
    //     $("#id_tags").select2({
    //         tags: true
    //     });
    // }, 5000);

    var editor_id = "";

    tinymce.PluginManager.add('instagram', function(editor, url) {
        // Add a button that opens a window
        editor.addButton('instagram', {
            text: 'Instagram',
            icon: false,
            onclick: function() {
                // Open window
                editor.windowManager.open({
                    title: 'Instagram Embed',
                    body: [
                        {   type: 'textbox',
                            size: 40,
                            height: '100px',
                            name: 'instagram',
                            label: 'instagram'
                        }
                    ],
                    onsubmit: function(e) {
                        // Insert content when the window form is submitted
                        var embedCode = e.data.instagram;
                        var script = embedCode.match(/<script.*<\/script>/)[0];
                        var scriptSrc = script.match(/".*\.js/)[0].split("\"")[1];
                        var sc = document.createElement("script");
                        sc.setAttribute("src", scriptSrc);
                        sc.setAttribute("type", "text/javascript");

                        var iframe = document.getElementById(editor_id + "_ifr");
                        var iframeHead = iframe.contentWindow.document.getElementsByTagName('head')[0];

                        tinyMCE.activeEditor.insertContent(e.data.instagram);
                        iframeHead.appendChild(sc);
                        // editor.insertContent('Title: ' + e.data.title);
                    }
                });
            }
        });
    });

    tinymce.PluginManager.add('twitter_url', function(editor, url) {
        editor.on('init', function (args) {
            editor_id = args.target.id;

        });
        editor.addButton('twitter_url',
            {
                text:'Twitter',
                icon: false,

                onclick: function () {

                    editor.windowManager.open({
                        title: 'Twitter Embed',

                        body: [
                            {   type: 'textbox',
                                size: 40,
                                height: '100px',
                                name: 'twitter',
                                label: 'twitter'
                            }
                        ],
                        onsubmit: function(e) {
                            var tweetEmbedCode = e.data.twitter;
                            tinyMCE.activeEditor.insertContent(
                            '<div class="div_border" contenteditable="false">' + tweetEmbedCode +
                            '</div>');
                            setTimeout(function() {
                                iframe.contentWindow.twttr.widgets.load();
                            }, 1000)
                        }
                    });
                }
            });
    });

    tinymce.init({
        selector: '.tinymce',
        height: 500,
        theme: 'modern',
        plugins: 'print preview paste searchreplace autolink directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists textcolor wordcount imagetools contextmenu colorpicker textpattern help figure code instagram twitter_url',
        toolbar1: 'formatselect | bold italic strikethrough blockquote forecolor backcolor | link | alignleft aligncenter alignright alignjustify  | numlist bullist outdent indent  | removeformat | code | instagram | twitter_url',
        image_advtab: true,
        templates: [
            {title: 'Test template 1', content: 'Test 1'},
            {title: 'Test template 2', content: 'Test 2'}
        ],
        content_css: [
            '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i'
        ],
        content_style: ".mce-content-body {font-size:20px;font-family:Arial,sans-serif !important;color: #000000;}",
        //valid_elements: "p,a[href|target],br,b,i,strong,i,em,img[src|alt|title|width|height|style],iframe[width|height|src|frameborder|allow|allowfullscreen],ul,li,ol,strike,s,del,u,sup,sub,code,h1,h2,h3,h4,h5,h6,style,table,tr,td,blockquote",
        valid_elements: '*[*]',
        extended_valid_elements : "figure[class],figcaption,script[language|type|async|src|charset]",
        custom_elements: "figure[class],figcaption",
        paste_as_text: true,
        setup: function (editor) {
            console.log(editor);
            editor.on('init', function (args) {
                editor_id = args.target.id;
            });
        }
    });

    tinymce.PluginManager.add('figure', function(editor, url) {
        // Adds a menu item to the tools menu
        editor.addMenuItem('fbfigure', {
            text: 'FB Figure',
            context: 'tools',
            onclick: function() {
                editor.insertContent(
                    '<figure>Image<figcaption><em>Caption</em></figcaption></figure><br/>'
                );
            }
        });
    });

    var currentDestinationRelationshipType = 'People';
    var csrftoken = Cookies.get('csrftoken');

    // url key names
    // search_relationship_type
    // search_node
    // create_relationship
    // update_relationship
    // delete_relationship

    var ajaxUrls = {};

    $.each($('template'), function (index, ele) {
        //console.log(ele)
        console.log($(ele).data('key'), $(ele).data('value'));
        ajaxUrls[$(ele).data('key')] = $(ele).data('value')
    });
    console.log(ajaxUrls);

    $('.relationship-type-tab').find('a').click(function () {
        currentDestinationRelationshipType = $(this).data('key');
        $(".select2.related").val(null);
        $(".select2.relationship").val(null);
        $(document).find('.select-wrapper').remove();
        $(document).find('.relationship-input').show();
        $(document).find('.enable-edit').show();
        $(document).find('.disable-edit').hide();
        $(document).find('.related-with').text(currentDestinationRelationshipType);
        console.log('Current relationship type', currentDestinationRelationshipType);
    });

    // ajax submission
    function safeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }


    $('.nav-tabs').find('a').on('click', function () {
        window.location.href = $(this).attr('href');
    });

    // select 2
    function createNewSelectItem(term, data) {
        if ($(data).filter(function () {
                return this.text.localeCompare(term) === 0;
            }).length === 0) {
            return {id: term, text: term};
        }
    }


    // select search relationship type
    if ($('.select2').hasClass('relationship')) {
        var relationTypeSelect = $('.select2.relationship');
        var sourceNodeType = relationTypeSelect.data('source-node-type');
        var destinationNodeType = relationTypeSelect.data('destination-node-type');
        relationTypeSelect.select2({
            ajax: {
                url: ajaxUrls['search_relationship_type'],
                data: function (params) {
                    console.log('query_params', params)
                    return {
                        source_node_type: sourceNodeType,
                        destination_node_type: currentDestinationRelationshipType,
                        relationship_name: params.term
                    };
                },
                dataType: 'json'
            },
            placeholder: 'Relationship',
            tags: true
        });
    }


    function setItems(item) {
        console.log(item);
        var $item = $('<span><img src="' + item.image + '" class="img-circle" style="width: 50px"/> ' + item.text + '</span>');
        return $item;
    }

    var neighbourhoodSelect = $('#id_neighbourhood');
    $('#id_city').change(function () {
        var cityId = $(this).val();
        neighbourhoodSelect.find('option').not(':first-child').remove();
        $.ajax({
            method: 'POST',
            url: ajaxUrls['get_neighbourhood'],
            dataType: 'json',
            data: {action: 'get_neighbourhood', city_id: cityId},
            success: function (response) {
                if (response.success) {
                    var neighbourhood = response.neighbourhood;
                    if (neighbourhood.length > 0) {
                        neighbourhood.forEach(function (e, i) {
                            var option = $('<option value="' + e.id + '">' + e.title + '</option>');
                            neighbourhoodSelect.append(option);
                        });

                    }
                }
            },
            beforeSend: function (xhr, settings) {
                if (!safeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    });

    // select2 search related node by relationship type
    $(".select2.related").select2({
        ajax: {
            url: ajaxUrls['search_node'],
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {search: params.term, type: currentDestinationRelationshipType};
            },
            processResults: function (data, params) {
                return {
                    results: data
                };
            }
            // cache: true
        },
        placeholder: 'Related with ',
        escapeMarkup: function (markup) {
            return markup;
        },
        minimumInputLength: 1,
        templateResult: setItems,
        templateSelection: setItems
    });

    function formatItem(item) {

        markup = item.text;
        return markup;
    }

    function formatItemSelection(item) {
        console.log(item);
        return item.source_node_name;
    }


    // create relationship
    $('.submit').on('submit', function () {
        $(this).find('input[name=destination_node_type]').val(currentDestinationRelationshipType);

        var formData = $(this).serialize();

        var action_url = $(this).attr('action');
        var btn = $(this).find('button[type=submit]');
        var btnContent = btn.html();
        console.log(action_url);
        btn.prop('disabled', true).html('loading...');


        $.ajax({
            method: 'POST',
            url: action_url,
            dataType: 'json',
            data: formData,
            success: function (response) {
                btn.prop('disabled', false).html(btnContent);
                // success
                if (response.success) {
                    $.Alert({text: response.message, label: 'success'});
                    window.location.href = '.';
                }
                else {
                    $.Alert({text: response.message, label: 'danger'});
                }
            },
            beforeSend: function (xhr, settings) {
                if (!safeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
        return false;
    });

    // enable edit
    $('.enable-edit').click(function () {
        var $target = $(this).data('target');
        var $select = $('<div class="select-wrapper"><select required data-source-node-type="" data-destination-node-type="" ' +
            'class="form-control relationship select2 relationship" name="relationship"></select>' +
            '<button class="btn btn-sm btn-primary save-relationship ml10">Save</button></div>');

        var $selectWrapper = $('<div class="select-wrapper"></div>');
        var $selectRelationship = $('<select required data-source-node-type="" data-destination-node-type="" class="form-control select2 relationship" name="relationship"></select>');
        var $selectRelatedWith = $('<select required data-source-node-type="" data-destination-node-type="" class="form-control select2 related" name="related"></select>');
        var $saveBtn = $('<button class="btn btn-sm btn-primary save-relationship">Save</button></div>');
        var currentReationship = $(this).data('relationship');
        var currentRelatedWith = $(this).data('related');

        $selectRelationship.appendTo($selectWrapper);
        $selectRelatedWith.appendTo($selectWrapper);
        $saveBtn.appendTo($selectWrapper);

        $(this).hide();
        $($target).find('input').hide();
        $(this).next().show();
        $($target).append($selectWrapper);

        $($target).find('select.relationship').select2({
            ajax: {
                url: ajaxUrls['search_relationship_type'],
                data: function (params) {
                    return {
                        source_node_type: 'People',
                        destination_node_type: currentDestinationRelationshipType
                    };
                },
                dataType: 'json'
            },
            placeholder: currentReationship,
            tags: true
        });

        $($target).find('select.related').select2({
            ajax: {
                url: ajaxUrls['search_node'],
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {search: params.term, type: currentDestinationRelationshipType};
                },
                processResults: function (data, params) {
                    return {
                        results: data
                    };
                }
                // cache: true
            },
            placeholder: currentRelatedWith,
            escapeMarkup: function (markup) {
                return markup;
            },
            minimumInputLength: 1,
            templateResult: setItems,
            templateSelection: setItems
        });

    });


    // save relationship
    $(document).on('click', '.save-relationship', function () {
        var selectWrapper = $(this).parent().parent();
        var relatedTd = selectWrapper.next('td');
        var deleteBtn = selectWrapper.parent().find('.disable-edit');
        var editBtn = selectWrapper.parent().find('.enable-edit');
        var relationship = selectWrapper.find('select.relationship').val();
        var relatedWith = selectWrapper.find('select.related').val();
        var relatedWithText = selectWrapper.find('select.related').text();
        var relationshipInput = selectWrapper.find('input');
        var currentRelationshipType = relationshipInput.val();
        var sourceNodeType = relationshipInput.data('source-node-type');
        var destinationNodeType = relationshipInput.data('destination-node-type');
        var sourceNodeId = relationshipInput.data('source-node-id');
        var destinationNodeId = relationshipInput.data('destination-node-id');
        var relationshipId = relationshipInput.data('relationship-id');
        var relationshipType = relationship || currentRelationshipType;
        var btnData = $(this).html();
        if (relationship || relatedWith) {
            $(this).prop('disabled', true).text('Saving...');
            console.log(relationship, sourceNodeType, destinationNodeType, destinationNodeId, sourceNodeId);

            $.ajax({
                method: 'POST',
                url: ajaxUrls['update_relationship'],
                dataType: 'json',
                data: {
                    'source_node_type': sourceNodeType,
                    'destination_node_type': currentDestinationRelationshipType,
                    'source_node_id': sourceNodeId,
                    'destination_node_id': destinationNodeId,
                    'relationship_id': relationshipId,
                    'relationship': relationship || currentRelationshipType,
                    'related_with': relatedWith
                },
                success: function (response) {
                    // btn.html(btnContent);
                    // success
                    if (response.success) {
                        selectWrapper.find('div').remove();
                        if (relationshipInput) {
                            relationshipInput.val(relationshipType);
                        }
                        if (relatedWithText) {
                            relatedTd.text(relatedWithText);
                        }

                        relationshipInput.show();
                        deleteBtn.hide();
                        editBtn.show();
                        $.Alert({text: response.message, label: 'success'});
                        if (response.redirect) {
                            // window.location.href = '.';
                        }
                    }
                },
                beforeSend: function (xhr, settings) {
                    if (!safeMethod(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                }
            });
        }
        else {
            $.Alert({text: "Please select a relationship or create new."});
        }

    });


    // disable edit
    $('.disable-edit').click(function () {
        var $target = $(this).data('target');
        $(this).prev().show();
        $(this).hide();
        $($target).find('div.select-wrapper').remove();
        $($target).find('input').show();
    });

    // delete relationship
    $(document).on('click', '.relationship-delete', function () {
        var relationshipId = $(this).data('id');
        $.Alert({
            prompt: true,
            onYesClick: function () {
                $.ajax({
                    method: 'POST',
                    url: ajaxUrls['delete_relationship'],
                    dataType: 'json',
                    data: {relationship_id: relationshipId},
                    success: function (response) {
                        if (response.success) {
                            window.location.href = '.';
                        }
                    },
                    beforeSend: function (xhr, settings) {
                        if (!safeMethod(settings.type) && !this.crossDomain) {
                            xhr.setRequestHeader("X-CSRFToken", csrftoken);
                        }
                    }
                });
            }
        });
    });

    // node search
    $('.search').keyup(function (e) {
        var nodeType = $(this).data('key');
        var keyword = $(this).val();
        console.log(keyword);
        var searchButton = $(this).next('span').find('button');
        var btnSearch = $('<i class="fa fa-search"></i>');
        var btnSpinner = $('<i class="fa fa-spinner"></i>');
        // var btnIconHtml = searchButton.html();

        var listWrapper = $(this).parent().parent().find('.search-list-wrapper');

        console.log(keyword, keyword.length);
        if (keyword.length >= 2) {
            searchButton.html(btnSpinner);
            listWrapper.find('*').remove();
            $.ajax({
                method: 'GET',
                url: ajaxUrls['search_node'],
                dataType: 'json',
                data: {search: keyword, type: nodeType},
                success: function (response) {
                    // success

                    console.log(response);
                    searchButton.html(btnSearch);
                    listWrapper.show();

                    var listItem;
                    for (listItem in response) {
                        var node = response[listItem];
                        listWrapper.append('<a href="' + node.priyo_id + '"><div>' +
                            '<img src="' + node.image + '" />' + node.text + '</div></a>');
                    }

                },
                beforeSend: function (xhr, settings) {
                    if (!safeMethod(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                }
            });
        }
    });

    $(document).bind("mousedown", function (event) {
        // If the clicked element is not the menu
        if (!$(event.target).parents('.search-list-wrapper').length > 0) {
            $('.search-list-wrapper').hide();
            $('.search-list-wrapper > *').remove();
        }
    });

    $('.date-picker').datepicker({
        format: 'yyyy-mm-dd',
        autoclose: true
    });

    $('.datetime-picker').datetimepicker({
        format: 'YYYY-MM-DD HH:mm:ss',
        // autoclose: true
    });


    // article select
    var queueSelectElement = $('#queue-feed');
    var queueId = queueSelectElement.data('queue');
    queueSelectElement.select2({
        ajax: {
            url: ajaxUrls['queue_articles'],
            data: function (params) {
                return {q: params.term, queue: queueId};
            },
            processResults: function (data) {
                return {
                    results: data
                };
            },
            dataType: 'json'
        }
    });

    // save que item
    var sortableWrapper = $('.sortable');
    var queueSaveBtn = $('.queue-save');
    $('#queue-item-form').submit(function () {
        var formData = $(this).serialize();
        console.log('form->data', formData);
        var feed = $(this).find('#queue-feed');
        var btn = $(this).find('button[type=submit]');
        var btnContent = btn.html();
        queueSaveBtn.show();
        sortableWrapper.append($('<li class="q-items ui-sortable-handle" data-feed="' + feed.val() + '" data-queue="3">\n' +
            '                    <small>' + feed.text() + '</small>\n' +
            '                    <span class="q-position">' + (parseInt(sortableWrapper.find('li').length) + 1) + '</span>\n' +
            '                    <span class="text-right" style="width: 100px;">\n' +
            '                        <i class="fa fa-trash ml10 obj-delete"></i>\n' +
            '                    </span>\n' +
            '                </li>'));
        feed.find('option').remove();
        return false;
    });

    // delete obj(Django)
    $(document).on('click', '.obj-delete', function () {
        var objId = $(this).data('id');
        var url = $(this).data('url');
        if (objId) {
            $.Alert({
                prompt: true,
                onYesClick: function () {
                    $.ajax({
                        method: 'POST',
                        url: url,
                        dataType: 'json',
                        data: {obj_id: objId, action: 'delete_obj'},
                        success: function (response) {
                            if (response.success) {
                                window.location.href = '.';
                            }
                        },
                        beforeSend: function (xhr, settings) {
                            if (!safeMethod(settings.type) && !this.crossDomain) {
                                xhr.setRequestHeader("X-CSRFToken", csrftoken);
                            }
                        }
                    });
                }
            });
        }
        else {
            $(this).parent().parent().remove();
        }

    });

    // sortable

    sortableWrapper.sortable({
        start: function (event, ui) {
            ui.item.startPos = ui.item.index();
            console.log(event)
        },
        stop: function (event, ui) {
            var arr = $('.q-items').map(function (i, el) {
                console.log($(el).find('.q-position').text(i + 1));
                $(el).attr('data-queue', i + 1);
                queueSaveBtn.show();
                return {priyo_queue_items_id: parseInt($(el).attr('data-id')), position: i + 1};
            });
            console.log(arr);
        }
    });

    queueSaveBtn.click(function () {
        var queueData = $('.sortable').find('.q-items').map(function (index, elm) {
            return {
                objectId: $(elm).data('id'),
                queue: $(elm).find('.q-position').text(),
                feedId: $(elm).data('feed')
            };
        });
        var btnText = queueSaveBtn.html();
        queueSaveBtn.text('Loading ..');
        $.ajax({
            method: 'POST',
            url: '.',
            dataType: 'json',
            data: {ids: JSON.stringify(Array.from(queueData)), action: 'save_queue'},
            success: function (response) {
                queueSaveBtn.html(btnText);
                queueSaveBtn.hide();
                if (response.success) {
                    //window.location.href = '.';
                }
                else {
                    $.Alert({text: response.message, label: 'danger'});
                }
            },
            beforeSend: function (xhr, settings) {
                if (!safeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    });

    $(document).find('.tinymce').removeAttr('required');

    $('#people-hometown').select2();
    $('#people-current-city').select2();


});

