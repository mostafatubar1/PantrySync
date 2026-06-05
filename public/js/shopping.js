document.addEventListener("DOMContentLoaded", function () {

  var toggleButtons = document.querySelectorAll(".toggle-btn");

  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var itemId = btn.getAttribute("data-id");

      fetch("/shopping-list/toggle/" + itemId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.success) {
            window.location.reload();
          } else {
            alert("Could not update item. Please try again.");
          }
        })
        .catch(function (err) {
          alert("Something went wrong. Please try again.");
        });
    });
  });

  var deleteButtons = document.querySelectorAll(".delete-btn");

  deleteButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var itemId = btn.getAttribute("data-id");

      var confirmed = confirm("Are you sure you want to delete this item?");
      if (!confirmed) {
        return;
      }

      fetch("/shopping-list/delete/" + itemId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.success) {
            var card = document.getElementById("card-" + itemId);
            if (card) {
              card.remove();
            }
          } else {
            alert("Could not delete item. Please try again.");
          }
        })
        .catch(function (err) {
          alert("Something went wrong. Please try again.");
        });
    });
  });

  var editModal = document.getElementById("edit-modal");
  var editForm = document.getElementById("edit-form");
  var editName = document.getElementById("edit-name");
  var editQuantity = document.getElementById("edit-quantity");
  var editUnit = document.getElementById("edit-unit");
  var editCost = document.getElementById("edit-cost");
  var closeModalBtn = document.getElementById("close-modal");

  var editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var itemId = btn.getAttribute("data-id");
      var name = btn.getAttribute("data-name");
      var quantity = btn.getAttribute("data-quantity");
      var unit = btn.getAttribute("data-unit");
      var cost = btn.getAttribute("data-cost");

      editForm.action = "/shopping-list/update/" + itemId;
      editName.value = name;
      editQuantity.value = quantity;
      editCost.value = cost;

      var options = editUnit.options;
      for (var i = 0; i < options.length; i++) {
        if (options[i].value === unit) {
          editUnit.selectedIndex = i;
          break;
        }
      }

      editModal.classList.remove("hidden");
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", function () {
      editModal.classList.add("hidden");
    });
  }

  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === editModal) {
        editModal.classList.add("hidden");
      }
    });
  }

  var alerts = document.querySelectorAll(".alert");
  if (alerts.length > 0) {
    setTimeout(function () {
      alerts.forEach(function (alert) {
        alert.style.display = "none";
      });
    }, 4000);
  }

});
