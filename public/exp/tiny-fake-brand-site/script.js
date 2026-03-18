const cartButton = document.getElementById("cartButton");
const cartDialog = document.getElementById("cartDialog");
const closeDialogButton = document.getElementById("closeDialogButton");

cartButton.addEventListener("click", () => cartDialog.showModal());
closeDialogButton.addEventListener("click", () => cartDialog.close());
