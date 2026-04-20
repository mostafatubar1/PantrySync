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
