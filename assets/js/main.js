function changeLang(langDataShow, langDataHide) {
    // location.reload();
    $('#preloader').show();
    setTimeout(() => {
        $('#preloader').hide();
    }, 1000);
    $(langDataShow).attr('hidden', false);
    $(langDataHide).attr('hidden', true);
}