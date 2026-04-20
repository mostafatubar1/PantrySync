window.onload = function () {
  const saved = localStorage.getItem("pantryData");
  if (saved) {
    document.getElementById("app-shell").innerHTML = saved;
  }
};

document.getElementById("add-btn").addEventListener("click", function () {
  const name = document.getElementById("food-search").value;
  const amount = document.getElementById("item-amount").value;
  const expiry = document.getElementById("item-expiry").value;
  const zone = document.getElementById("item-zone").value;

  if (!name) {
    alert("Please enter a food item");
    return;
  }

  let targetZone = document.getElementById(zone);

  if (zone === "auto") {
    targetZone = document.getElementById("zone-pantry");
  }

  const item = document.createElement("div");
  item.className = "food-item";

  item.innerHTML = `
    <strong>${name}</strong><br>
    Amount: ${amount}<br>
    Expiry: ${expiry || "N/A"}
  `;

  targetZone.appendChild(item);
});


const today = new Date();
const expiryDate = new Date(expiry);

if (expiry && expiryDate < today) {
  item.style.border = "2px solid red";
}

item.addEventListener("click", function () {
  item.remove();
});

localStorage.setItem("pantryData", document.getElementById("app-shell").innerHTML);
