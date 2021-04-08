// Index.js handles sidebar behaviour and other index.html-wide issues
menuOpened = 0;
/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
    if (menuOpened == 0) {
        document.getElementById("navSidebar").style.width = "250px";
        document.getElementById("main").style.marginLeft = "250px";
        menuOpened = 1;
    } else{
        closeNav();
    }
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
    document.getElementById("navSidebar").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    menuOpened = 0;
}