let nav = $("#mainMenu");
let navToggle = $("#navToggle");

navToggle.on("click", function(event){
    event.preventDefault();
    nav.toggleClass("show");
});