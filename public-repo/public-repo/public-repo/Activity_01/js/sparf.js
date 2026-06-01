$(document).ready(function () {
    $("p.numbered").each(function () {
        $(this).on("click", function () {
            $("p.numbered").each(function () {
                $(this).attr('style', 'background: none;')
            });
            $(this).attr('style', 'background: rgba(255, 171, 40, 0.2);')
        });
    });
    $("pre.code").each(function () {
        $(this).prepend("<button class=\"btn\"><img width=\"13\" src=\"images/copy.svg\" alt=\"\"/></button>");
    });
    $("pre.toggle").each(function () {
        $(this).hide(0);
        $(this).before("<span class='toggle'>Show Code</span>")
    });
    $("span.toggle").each(function () {
        $(this).on("click", function () {
            if ($(this).next().is(":hidden")) {
                $(this).text("Hide code")
                $(this).next().show(500)
            } else {
                $(this).text("Show code")
                $(this).next().hide(500);
            }
        })
    });

    var clipboard= new ClipboardJS('.btn', {
        target: function(trigger) {
            return trigger.nextElementSibling;
        }
    });

    clipboard.on('success', function (e) {
        console.info('Action:', e.action);
        console.info('Text:', e.text);
        console.info('Trigger:', e.trigger);
        e.clearSelection();
        $(e.trigger).attr('aria-label', 'Copied to Clipboard');

    });


    $(".btn").each(function () {
        $(this).on("mouseleave", function () {
            $(this).removeAttr('aria-label')
        });
        $(this).on("blur", function () {
            $(this).removeAttr('aria-label')
        });
    });

    hljs.highlightAll();
	$('#copyrightyear').text(new Date().getFullYear());
});
