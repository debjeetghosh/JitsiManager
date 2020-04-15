/**
 * Created on Nov, 28 2017.
 * @ priyo
 */

jQuery.Alert = function (options) {
    var defaults = {
        text: null, // GET, POST, PUT, DELETE
        prompt: false,
        label: 'default',
        type: 'danger',
        hide: false,
        duration: 5000,
        ajax: false,
        ajaxUrl: '.',
        ajaxData: null,
        onSuccess: function () {},
        onYesClick: function () {},
        onNoClick: function () {}
    };
    var alertWraper;
    var o = jQuery.extend(defaults, options);
    var overlay = $('<div class="overlay"></div>');

    if(defaults.prompt){
        overlay.appendTo('body');
    }

    var alertText = defaults.text || 'Do you really want to delete this item ?';

    if (o.prompt) {
        alertWraper = $('<div permission="alert" class="prompt"> <div><h4>'+alertText+'</h4></div> <div>' +
            '<button class="btn btn-yes btn-sm ml10"><i class="fa fa-check"></i> Yes</button> ' +
            '<button class="btn btn-no btn-sm"><i class="fa fa-times"></i> No</button></div></div>');
    }
    else {
        alertWraper = $('<div permission="alert" class="prompt"><h4 class="pull-left">' + alertText + '</h4>' +
            '<a href="#" class="close pull-right" data-dismiss="alert" aria-label="close" title="close">×</a></div>');
    }

    $(document).find('.prompt').remove();
    alertWraper.appendTo('body').hide();
    alertWraper.addClass(defaults.label);
    alertWraper.css('left', $(window).outerWidth()/2 - alertWraper.outerWidth()/2);
    alertWraper.show(100, function () {
        $(this).addClass('move');
    });

    alertWraper.find('.btn-yes').on('click', function (e) {
        o.onYesClick.call(this);
    });

    alertWraper.find('.btn-no').on('click', function (e) {
        alertWraper.remove();
        overlay.remove();
        o.onNoClick.call(this);
    });

    alertWraper.find('.close').click(function () {
        alertWraper.remove();
    });


    if(o.hide && !o.prompt){
        setTimeout(function () {
        alertWraper.fadeOut(1000, function () {
            $(this).remove();
        })
    }, o.duration)
    }
};