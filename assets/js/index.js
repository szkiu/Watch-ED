"use strict";
const d = document;
const sections = document.querySelectorAll("section[id]");
const $fragment = d.createDocumentFragment();

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then((registration) => {
      console.log("SW registered!");
      console.log(registration);
    })
    .catch((err) => {
      console.log("Error", err);
    });
} else {
  console.log("Your navigator don't supports serviceWorkers");
}
// END Service Worker

// indexedDB
if (indexedDB) {
  let db;
  const request = window.indexedDB.open("Watches", 1);

  request.onsuccess = (e) => {
    db = request.result;
  };

  request.onupgradeneeded = (e) => {
    db = request.result;
    const objectStore = db.createObjectStore("watches", {
      keyPath: "id",
    });
  };

  request.onerror = (err) => {
    console.log("Error", err);
  };

  //CRUD
  const addData = (x) => {
    const transaction = db.transaction(["watches"], "readwrite");
    const objectStore = transaction.objectStore("watches");
    const request = objectStore.add(x);
  };

  const putAllData = () => {
    const transaction = db.transaction("watches");
    const objectStore = transaction.objectStore("watches");
    const request = objectStore.openCursor();
    request.onsuccess = (e) => {
      const cursor = request.result;
      if (cursor) {
        const data = cursor.value;

        // Calling Template
        const $template = d.querySelector(".cart__template").content;
        const $card = $template.querySelector(".cart__card");
        const $img = $template.querySelector(".cart_img");
        const $title = $template.querySelector(".cart__card-title");
        const $price = $template.querySelector(".cart__card-price");
        const $amount = $template.querySelector(".cart__amount");

        //Changing Data
        //Card
        $card.dataset.id = data.id;
        //Img
        $img.src = data.url;
        $img.alt = data.name;
        //Title
        $title.textContent = data.name;
        //Price
        $price.textContent = data.price;
        //Amount
        $amount.textContent = data.amount;

        //Cloning
        const $clone = d.importNode($template, true);
        $fragment.appendChild($clone);
        cursor.continue();
      } else {
        //Adding
        d.querySelector(".cart__content").textContent = "";
        d.querySelector(".cart__content").appendChild($fragment);
      }
    };
  };

  const updateData = (x) => {
    const transaction = db.transaction(["watches"], "readwrite");
    const objectStore = transaction.objectStore("watches");
    const request = objectStore.put(x);
  };

  const deleteData = (key) => {
    const transaction = db.transaction(["watches"], "readwrite");
    const objectStore = transaction.objectStore("watches");
    const request = objectStore.delete(key);
  };

  const clearAllData = () => {
    const transaction = db.transaction(["watches"], "readwrite");
    const objectStore = transaction.objectStore("watches");
    const request = objectStore.clear();
  };

  //Items
  function getItems() {
    const $card = d.querySelectorAll(".cart__card");
    const $items = d.querySelector(".cart__items");
    let items;
    $card.forEach((el, ind) => {
      items = ind + 1;
    });
    $items.textContent = `${items} items`;
    if ($items.textContent.startsWith("undefined")) {
      $items.textContent = ``;
    }
    d.querySelector(".cart__buy").textContent = "Buy";
    if (items < 0 || items == undefined) {
      d.querySelector(".cart__buy").classList.add("discover");
    }

    if (items < 1 || items != undefined) {
      d.querySelector(".cart__buy").classList.remove("discover");
    }

    calculatePrice();
  }

  //Summation
  function calculatePrice() {
    const transaction = db.transaction(["watches"]);
    const objectStore = transaction.objectStore("watches");
    const request = objectStore.openCursor();
    let result = 0;
    const $price = d.querySelector(".cart_price");

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const value = cursor.value;
        const number =
          value.amount * Number.parseInt(value.price.split("$")[0]);
        result += number;
        cursor.continue();
      } else {
        $price.textContent = `$${result}`;
        if ($price.textContent.startsWith("$0")) {
          $price.textContent = "";
        }
      }
    };
  }

  //Charging page
  addEventListener("load", (e) => {
    setTimeout(() => putAllData(), 100);
    setTimeout(() => getItems(), 500);
    setTimeout(() => calculatePrice(), 100);
  });

  //Indexed ADDWATCHES
  d.addEventListener("click", (e) => {
    const theme = localStorage.getItem("themes").split('"')[3];
    //Adding to cart
    const addCart = async (x) => {
      const request = await fetch("./assets/json/watches.json");
      const json = await request.json();
      const watchesStore = json[0];

      try {
        if (request.ok) {
          watchesStore.forEach((el, ind) => {
            if (el.id === Number.parseInt(x.dataset.id)) {
              const watchObject = {
                id: el.id,
                amount: 1,
                url: el.location,
                price: el.price,
                name: el.name,
              };
              addData(watchObject);
              putAllData();
            }
          });
        }
      } catch (err) {
        const $modalErr = d.createElement("div");
        $modalErr.classList.add("modal-err");
        $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
        d.querySelector("header").insertAdjacentElement(
          "beforebegin",
          $modalErr
        );
      }
    };

    //Updating data
    const addAmount = (id) => {
      const $card = d.querySelectorAll(".cart__card");
      $card.forEach((el) => {
        if (el.dataset.id === id) {
          const url = el.querySelector(".cart_img").src;
          el.querySelector(".cart__amount").textContent++;
          const name = el.querySelector(".cart_img").alt;
          const price = el.querySelector(".cart__card-price").textContent;
          const ID = Number.parseInt(id);
          const amount = Number.parseInt(
            el.querySelector(".cart__amount").textContent
          );
          updateData({
            id: ID,
            amount: amount,
            url: url,
            price: price,
            name: name,
          });
        }
      });
    };

    const substractAmount = (id) => {
      const $card = d.querySelectorAll(".cart__card");
      $card.forEach((el) => {
        if (el.dataset.id === id) {
          const url = el.querySelector(".cart_img").src;
          el.querySelector(".cart__amount").textContent--;
          const name = el.querySelector(".cart_img").alt;
          const price = el.querySelector(".cart__card-price").textContent;
          const ID = Number.parseInt(id);
          const amount = Number.parseInt(
            el.querySelector(".cart__amount").textContent
          );
          updateData({
            id: ID,
            amount: amount,
            url: url,
            price: price,
            name: name,
          });
        }
      });
    };

    //Confirm
    const confirmData = (id) => {
      const content = d.querySelectorAll(".cart__card");
      const contDataId = [];
      content.forEach((el) => {
        contDataId.push(el.dataset.id);
      });
      const ID = id;
      let confirm = false;
      contDataId.forEach((el) => {
        if (ID === el) {
          confirm = true;
        }
      });
      return confirm;
    };

    //HOME
    if (e.target.matches(".home__description-buy")) {
      const confirm = confirmData(e.target.dataset.id);

      if (confirm) {
        addAmount(e.target.dataset.id);
        calculatePrice();
        setTimeout(() => getItems(), 100);
      } else {
        if (theme === "light") {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
        } else {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__card-title")
                .forEach((el) => el.classList.toggle("text-dark-title")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__minus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__plus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__container-img")
                .forEach((el) =>
                  el.classList.toggle("background-dark-normal-alt")
                ),
            100
          );
        }
      }
    }

    //FEATURE
    if (e.target.matches(".feature__buy")) {
      const confirm = confirmData(e.target.dataset.id);

      if (confirm) {
        addAmount(e.target.dataset.id);
        calculatePrice();
        setTimeout(() => getItems(), 100);
      } else {
        if (theme === "light") {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
        } else {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__card-title")
                .forEach((el) => el.classList.toggle("text-dark-title")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__minus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__plus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__container-img")
                .forEach((el) =>
                  el.classList.toggle("background-dark-normal-alt")
                ),
            100
          );
        }
      }
    }

    // PRODUCT
    if (e.target.matches(".product__sale")) {
      const confirm = confirmData(e.target.dataset.id);

      if (confirm) {
        addAmount(e.target.dataset.id);
        calculatePrice();
        setTimeout(() => getItems(), 100);
      } else {
        if (theme === "light") {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
        } else {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__card-title")
                .forEach((el) => el.classList.toggle("text-dark-title")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__minus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__plus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__container-img")
                .forEach((el) =>
                  el.classList.toggle("background-dark-normal-alt")
                ),
            100
          );
        }
      }
    }

    if (e.target.matches(".bx-shopping-bag")) {
      const div = e.target.closest("div");
      const confirm = confirmData(div.dataset.id);

      if (confirm) {
        addAmount(div.dataset.id);
        setTimeout(() => getItems(), 100);
      } else {
        if (theme === "light") {
          addCart(div);
          setTimeout(() => getItems(), 100);
        } else {
          addCart(div);
          setTimeout(() => getItems(), 100);
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__card-title")
                .forEach((el) => el.classList.toggle("text-dark-title")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__minus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__plus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__container-img")
                .forEach((el) =>
                  el.classList.toggle("background-dark-normal-alt")
                ),
            100
          );
        }
      }
    }

    // NEW
    if (e.target.matches(".new__buy")) {
      const confirm = confirmData(e.target.dataset.id);

      if (confirm) {
        addAmount(e.target.dataset.id);
        calculatePrice();
        setTimeout(() => getItems(), 100);
      } else {
        if (theme === "light") {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
        } else {
          addCart(e.target);
          setTimeout(() => getItems(), 100);
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__card-title")
                .forEach((el) => el.classList.toggle("text-dark-title")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__minus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__plus")
                .forEach((el) => el.classList.toggle("text-dark")),
            100
          );
          setTimeout(
            () =>
              d
                .querySelectorAll(".cart__container-img")
                .forEach((el) =>
                  el.classList.toggle("background-dark-normal-alt")
                ),
            100
          );
        }
      }
    }

    //ADD QUANTITY
    if (e.target.matches(".cart__plus")) {
      const theme = localStorage.getItem("themes").split('"')[3];

      const id = e.target.closest(".cart__card").dataset.id;
      addAmount(id);
      calculatePrice();
      setTimeout(() => getItems(), 100);
    }

    //SUBSTRACT QUANTITY
    if (e.target.matches(".cart__minus")) {
      const amount = e.target.nextElementSibling.textContent;
      const $card = e.target.closest(".cart__card");
      const id = e.target.closest(".cart__card").dataset.id;
      const $containerCard = d.querySelector(".cart__content");

      if (amount > 1) {
        substractAmount(id);
        calculatePrice();
        setTimeout(() => getItems(), 100);
      } else {
        deleteData(Number.parseInt(id));
        $containerCard.removeChild($card);
        calculatePrice();
        getItems();
      }
    }

    //DELETE
    if (e.target.matches(".cart__trash")) {
      const $card = e.target.closest(".cart__card");
      const id = e.target.closest(".cart__card").dataset.id;
      const $containerCard = d.querySelector(".cart__content");
      deleteData(Number.parseInt(id));
      $containerCard.removeChild($card);
      calculatePrice();
      getItems();
    }

    // DELETE ALL
    if (e.target.matches(".cart__buy")) {
      setTimeout(() => {
        clearAllData();
        putAllData();
        setTimeout(() => getItems(), 10);
      }, 1000);
    }
  });
}
// END indexedDB

//DarkMode
const setTheme = () => {
  const localDB = localStorage.getItem("themes");
  if (localDB === null) {
    localStorage.setItem("themes", JSON.stringify({ theme: "light" }));
  } else if (localDB.split('"')[3] === "dark") {
    setTimeout(() => changeColors(), 50);
  }
};

addEventListener("load", setTheme);

d.addEventListener("click", (e) => {
  if (e.target.matches("#theme-button")) {
    const localDB = localStorage.getItem("themes");
    const themeValue = localDB.split('"')[3];
    if (themeValue === "light") {
      const localDB = localStorage.getItem("themes");
      localStorage.setItem("themes", JSON.stringify({ theme: "dark" }));
      changeColors();
    }
    if (themeValue === "dark") {
      const localDB = localStorage.getItem("themes");
      localStorage.setItem("themes", JSON.stringify({ theme: "light" }));
      changeColors();
      d.querySelectorAll(".product__card").forEach((el) => {
        el.style.backgroundColor = "#fff";
        el.style.borderColor = "#F0F0F0";
      });
      d.querySelectorAll(".product__name").forEach((el) =>
        el.classList.remove("text-dark")
      );
      if (scrollY >= 15) {
        d.querySelector(".header").classList.add("background-white");
        d.querySelector(".header").classList.remove("background-white-dark");
      }
    }
  }
});

const changeColors = () => {
  const $i = d.getElementById("theme-button");
  $i.classList.toggle("bx-sun");
  d.body.classList.toggle("body-dark");
  d.querySelector(".home__description-discover").style.backgroundColor =
    "rgba(192, 192, 192, 35)";
  d.querySelectorAll(".bx-nav").forEach((el) =>
    el.classList.toggle("text-dark")
  );
  d.querySelector(".nav__logo").classList.toggle("text-dark");
  d.querySelectorAll(".home__social-link").forEach((el) =>
    el.classList.toggle("text-dark")
  );
  d.querySelectorAll(".featured__info").forEach((el) =>
    el.classList.toggle("background-dark-alt")
  );
  d.querySelectorAll("p").forEach((el) => el.classList.toggle("text-dark"));
  d.querySelectorAll("h3").forEach((el) => el.classList.toggle("text-dark"));
  d.querySelectorAll(".product__card").forEach((el) => {
    el.style.backgroundColor = "#212121";
    el.style.borderColor = "#212121";
  });
  d.querySelectorAll(".new__container").forEach((el) =>
    el.classList.toggle("background-dark-normal")
  );
  d.querySelector(".back-to-menu").classList.toggle("background-dark-alt");
  d.querySelector(".testimonial__quote").classList.toggle(
    "background-dark-alt"
  );
  d.querySelector(".bx-left-arrow-alt").classList.toggle("background-dark-alt");
  d.querySelector(".click-me").classList.toggle("background-dark-alt");
  d.querySelector(".footer").classList.toggle("background-dark-alt");
  d.querySelector(".newsletter__container").classList.toggle(
    "first-color-dark"
  );
  d.querySelector(".testimonial__text").classList.remove("text-dark");
  d.querySelector(".story__des").classList.remove("text-dark");
  d.querySelector(".story__des").classList.toggle("text-dark-alt");
  d.querySelectorAll(".feature__buy").forEach((el) =>
    el.classList.toggle("first-color-dark")
  );
  d.querySelectorAll(".footer__title").forEach((el) =>
    el.classList.toggle("text-dark")
  );
  d.querySelectorAll(".footer-info").forEach((el) =>
    el.classList.toggle("text-dark-alt")
  );
  d.querySelector(".testimonial__text").classList.toggle("text-dark-alt");
  d.querySelector(".testimonial__job").classList.remove("text-dark");
  d.querySelector(".footer__rights").classList.toggle("text-dark");
  d.querySelector(".testimonial__job").classList.toggle("text-dark-alt");
  if (scrollY >= 15) {
    d.querySelector(".header").classList.add("background-white-dark");
    d.querySelector(".header").classList.remove("background-white");
    d.querySelectorAll(".bx-nav").forEach((el) =>
      el.classList.add("bx-color-dark")
    );
  }
  d.querySelector(".nav__container-resume").classList.toggle(
    "background-dark-normal"
  );
  d.querySelectorAll(".nav__resume-link").forEach((el) =>
    el.classList.toggle("text-dark")
  );
  d.querySelector(".nav__cart").classList.toggle("background-dark-normal");
  d.querySelector(".cart__principal-title").classList.toggle("text-dark-title");
  setTimeout(
    () =>
      d
        .querySelectorAll(".cart__card-title")
        .forEach((el) => el.classList.toggle("text-dark-title")),
    500
  );
  setTimeout(
    () =>
      d
        .querySelectorAll(".cart__minus")
        .forEach((el) => el.classList.toggle("text-dark")),
    500
  );
  setTimeout(
    () =>
      d
        .querySelectorAll(".cart__plus")
        .forEach((el) => el.classList.toggle("text-dark")),
    500
  );
  setTimeout(() =>
    d.querySelector(".cart__items").classList.toggle("text-dark")
  );
  setTimeout(() =>
    d.querySelector(".cart_price").classList.toggle("text-dark-alt")
  );
  setTimeout(
    () =>
      d
        .querySelectorAll(".cart__container-img")
        .forEach((el) => el.classList.toggle("background-dark-normal-alt")),
    500
  );
};
//END DarkMode

// Menu Bar
d.addEventListener("click", (e) => {
  if (e.target.matches(".bx-menu")) {
    d.querySelector(".nav__container-resume").style.right = "0%";
  }

  if (e.target.matches(".nav__container-cross") || e.target.matches(".bx-x")) {
    d.querySelector(".nav__container-resume").style.right = "-100%";
  }

  if (e.target.matches(".nav__resume-link")) {
    d.querySelector(".nav__container-resume").style.right = "-100%";
  }
});
// END Menu Bar

// Scroll Header
addEventListener("scroll", (e) => {
  const localDB = localStorage.getItem("themes");
  if (localDB.split('"')[3] === "light") {
    if (scrollY >= 15) {
      d.querySelector(".header").classList.add("background-white");
      d.querySelector(".header").classList.remove("background-white-dark");
    } else {
      d.querySelector(".header").classList.remove("background-white");
      d.querySelector(".header").classList.remove("background-white-dark");
    }
  }

  if (localDB.split('"')[3] === "dark") {
    if (scrollY >= 15) {
      d.querySelector(".header").classList.add("background-white-dark");
      d.querySelector(".header").classList.remove("background-white");
      d.querySelectorAll(".bx-nav").forEach((el) =>
        el.classList.add("bx-color-dark")
      );
    } else {
      d.querySelector(".header").classList.remove("background-white-dark");
      d.querySelectorAll(".bx-nav").forEach((el) =>
        el.classList.remove("bx-color-dark")
      );
      d.querySelector(".header").classList.remove("background-white");
    }
  }
});
//END Scroll Header

// Back To Home
addEventListener("scroll", (e) => {
  const $BTW = d.querySelector(".back-to-menu");
  if (scrollY >= 20) {
    $BTW.classList.add("show-to-menu");
  } else {
    $BTW.classList.remove("show-to-menu");
  }
});
//END Back To Home

// Active Link
addEventListener("scroll", (e) => {
  const scrollY = window.pageYOffset;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight,
      sectionTop = current.offsetTop - 58,
      sectionId = current.getAttribute("id"),
      sectionsClass = document.querySelector(
        ".nav__resume a[href*=" + sectionId + "]"
      );

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      sectionsClass.classList.add("active-link");
    } else {
      sectionsClass.classList.remove("active-link");
    }
  });
});
// END Active Link

// Cart
d.addEventListener("click", (e) => {
  if (e.target.matches(".bx-cart")) {
    d.querySelector(".nav__cart").style.right = "0%";
  }

  if (e.target.matches(".nav__container-cross") || e.target.matches(".bx-x")) {
    d.querySelector(".nav__cart").style.right = "-100%";
  }
});
// END Cart

// Nav
const mql = matchMedia("(min-width: 1280px)");
const mqlBig = matchMedia("(min-width: 1280px) and (-webkit-max-device-pixel-ratio: 1.5)");

if (mql.matches) {
  const $nav = d.querySelector(".nav");
  const $navResume = d.querySelector(".nav__container-resume");
  const $navContainer = d.querySelector(".nav__container");
  const $homeContainer = d.querySelector(".home__container");
  const $homeDescription = d.querySelector(".home__description");
  const $homeContainerImg = d.querySelector(".home__container-img");
  const $storyImg = d.querySelector(".story__img");
  const $storyInfo = d.querySelector(".story__info");

  $nav.removeChild($navResume);
  $navContainer.insertAdjacentElement("beforebegin", $navResume);

  $homeContainer.removeChild($homeDescription);
  $homeContainerImg.insertAdjacentElement("beforebegin", $homeDescription);

  if(mqlBig.matches){
    $storyImg.remove();
    $storyInfo.insertAdjacentElement("beforebegin", $storyImg);
  }
}
// END Nav

// Home
(async function () {
  const request = await fetch("./assets/json/watches.json");
  const json = await request.json();

  try {
    if (request.ok) {
      // Home Img
      const $homeImg = d.querySelector(".home__img");
      $homeImg.src = json[0][0].location;
      $homeImg.alt = `Watch ${json[0][0].name}`;
      // Home Description Title
      const $homeDesTitle = d.querySelector(".home__description-title");
      $homeDesTitle.innerHTML = `NEW WATCH COLLECTION <span class="font-principal-color">${json[0][0].name.toUpperCase()}</span>`;
      // Home Description Data
      const $homeDesData = d.querySelector(".home__description-data");
      $homeDesData.innerHTML = `Latest arrival of the new imported watches of the B720 series, with a modern and resistant design.`;
      // Home Description Price
      const $homeDesPrice = d.querySelector(".home__description-price");
      $homeDesPrice.textContent = json[0][0].price;
      //Button
      d.querySelector(".home__description-buy").dataset.id = json[0][0].id;
    }
  } catch (e) {
    const $modalErr = d.createElement("div");
    $modalErr.classList.add("modal-err");
    $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
    d.querySelector("header").insertAdjacentElement("beforebegin", $modalErr);
  }
})();
// END Home

// Featured
(async function () {
  const request = await fetch("./assets/json/watches.json");
  const json = await request.json();

  try {
    if (request.ok) {
      const $featuredInfo = d.querySelectorAll(".featured__info");
      const watchStoreage = json[0];
      $featuredInfo.forEach((el, ind) => {
        const $img = el.querySelector("img");
        $img.src = watchStoreage[el.classList.value.split(" ")[1] - 1].location;
        $img.alt = watchStoreage[el.classList.value.split(" ")[1] - 1].name;
        const $name = el.querySelector("h3");
        $name.textContent =
          watchStoreage[el.classList.value.split(" ")[1] - 1].name;
        const $price = el.querySelector(".featured__price");
        $price.textContent =
          watchStoreage[el.classList.value.split(" ")[1] - 1].price;
        const $button = el.querySelector(".feature__buy");
        $button.dataset.id =
          watchStoreage[el.classList.value.split(" ")[1] - 1].id;
      });
    }
  } catch (e) {
    const $modalErr = d.createElement("div");
    $modalErr.classList.add("modal-err");
    $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
    d.querySelector("header").insertAdjacentElement("beforebegin", $modalErr);
  }
})();

d.addEventListener("click", (e) => {
  const $cards = d.querySelectorAll(".featured__info");
  $cards.forEach((card) => {
    const $cardChilds = card.querySelectorAll("*");
    $cardChilds.forEach((el) => {
      if (e.target === el && e.target.textContent !== "ADD TO CART") {
        const $padre = e.target.closest(".featured__info");
        $padre.classList.toggle("featured__info-shadow");
        const $divNone = $padre.querySelector(".feature__buy");
        $divNone.classList.toggle("feature_buy-visibility");
        $divNone.classList.toggle("button");
      }
    });
  });

  if (e.target.matches(".featured__info")) {
    e.target
      .querySelector(".feature__buy")
      .classList.toggle("feature_buy-visibility");
    e.target.querySelector(".feature__buy").classList.toggle("button");
    e.target.classList.toggle("featured__info-shadow");
  }
});
//END Home

// History
(async function () {
  const request = await fetch("./assets/json/watches.json");
  const json = await request.json();

  try {
    if (request.ok) {
      const $homeImg = d.querySelector(".story__picture");
      $homeImg.src = json[0][12].location;
      $homeImg.alt = `Watch ${json[0][12].name}`;
    }
  } catch (e) {
    const $modalErr = d.createElement("div");
    $modalErr.classList.add("modal-err");
    $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
    d.querySelector("header").insertAdjacentElement("beforebegin", $modalErr);
  }
})();

d.querySelector(".story__buy").addEventListener("click", (e) =>
  d.querySelector(".discover").click()
);
// END History

//Product
(async function () {
  const request = await fetch("./assets/json/watches.json");
  const json = await request.json();

  try {
    if (request.ok) {
      const $productCard = d.querySelectorAll(".product__card");
      const watchStoreage = json[0];
      $productCard.forEach((el, ind) => {
        const $img = el.querySelector("img");
        $img.src = watchStoreage[el.classList.value.split(" ")[1] - 1].location;
        $img.alt = watchStoreage[el.classList.value.split(" ")[1] - 1].name;
        const $name = el.querySelector("h3");
        $name.textContent = watchStoreage[
          el.classList.value.split(" ")[1] - 1
        ].name
          .replace("Automatic", "")
          .replace("  ", " ");
        const $price = el.querySelector(".product__price");
        $price.textContent =
          watchStoreage[el.classList.value.split(" ")[1] - 1].price;
        const $button = el.querySelector(".product__sale");
        $button.dataset.id =
          watchStoreage[el.classList.value.split(" ")[1] - 1].id;
      });
    }
  } catch (e) {
    const $modalErr = d.createElement("div");
    $modalErr.classList.add("modal-err");
    $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
    d.querySelector("header").insertAdjacentElement("beforebegin", $modalErr);
  }
})();

d.addEventListener("click", (e) => {
  if (e.target.textContent === "Click me to see more!") {
    (async function () {
      const request = await fetch("./assets/json/watches.json");
      const json = await request.json();
      const theme = localStorage.getItem("themes").split('"')[3];

      try {
        const storage = [json[0][1], json[0][2]];
        const $template = d.querySelector(".product__card-template").content;

        if (theme === "light") {
          storage.forEach((el, ind) => {
            const $img = $template.querySelector("img");
            $img.src = el.location;
            $img.alt = el.name;
            const $h3 = $template.querySelector("h3");
            $h3.textContent = `${el.name}`;
            const $span = $template.querySelector("span");
            $span.textContent = `${el.price}`;
            const $button = $template.querySelector(".product__sale");
            $button.dataset.id = el.id;
            const $div = $template.querySelector(".product__card");
            $div.style.backgroundColor = "#fff";
            $div.style.borderColor = "#F0F0F0";
            const $clone = d.importNode($template, true);
            $fragment.appendChild($clone);
          });
          e.target.closest("div").previousElementSibling.appendChild($fragment);
        }

        if (theme === "dark") {
          storage.forEach((el, ind) => {
            const $img = $template.querySelector("img");
            $img.src = el.location;
            $img.alt = el.name;
            const $h3 = $template.querySelector("h3");
            $h3.textContent = `${el.name}`;
            const $span = $template.querySelector("span");
            $span.textContent = `${el.price}`;
            const $button = $template.querySelector(".product__sale");
            $button.dataset.id = el.id;
            const $div = $template.querySelector(".product__card");
            $div.style.backgroundColor = "#212121";
            $div.style.borderColor = "#212121";
            const $clone = d.importNode($template, true);
            $fragment.appendChild($clone);
          });
          e.target.closest("div").previousElementSibling.appendChild($fragment);
        }

        if (e.target.matches(".click-me")) {
          e.target.innerHTML = "Click me to see less!";
        }
      } catch (err) {
        const $modalErr = d.createElement("div");
        $modalErr.classList.add("modal-err");
        $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
        d.querySelector("header").insertAdjacentElement(
          "beforebegin",
          $modalErr
        );
      }
    })();
  }

  if (e.target.textContent === "Click me to see less!") {
    e.target
      .closest("div")
      .previousElementSibling.querySelectorAll(".product__card")
      .forEach((el, ind) => {
        if (el.classList[1] === undefined) {
          e.target.closest("div").previousElementSibling.removeChild(el);
        }
      });
    if (e.target.matches(".click-me")) {
      e.target.innerHTML = "Click me to see more!";
    }
  }
});
//END Product

// Testimonial
(async function () {
  const request = await fetch("./assets/json/watches.json");
  const json = await request.json();
  const mql = matchMedia("(min-width: 1280px)");

  if (mql.matches){
    try {
      if (request.ok) {
        const testimonial = json[1].shift();
        const testimonials = json[1];
        const $template = d.querySelector(".testimonial__template").content;
  
        testimonials.forEach((el, ind) => {
          const $resume = $template.querySelector(".testimonial__text");
          $resume.innerHTML = el.resume;
          const $date = $template.querySelector(".testimonial__date");
          $date.innerHTML = el.date;
          const $img = $template.querySelector(".testimonial__img");
          $img.src = el.location;
          $img.alt = `${el.name}, ${el.jobTitle}`;
          const $name = $template.querySelector(".testimonial__name");
          $name.innerHTML = el.name;
          const $job = $template.querySelector(".testimonial__job");
          $job.innerHTML = el.jobTitle;
  
          const $clone = d.importNode($template, true);
          $fragment.appendChild($clone);
        });
        d.querySelector(".testimonial__global").appendChild($fragment);
        d.querySelector(".testimonial__global").firstElementChild.classList.add(
          "display-block"
        );
  
        const $buttonCont = d.createElement("DIV");
        $buttonCont.classList.add("testimonial__buttons");
        const $adjust = d.createElement("DIV");
        $adjust.classList.add("testimonial__adjust");
        // const $left = d.createElement("I");
        // $left.classList.add("bx", "bx-left-arrow-alt", "change-testimonial");
        const $right = d.createElement("I");
        $right.classList.add("bx", "bx-left-arrow-alt", "change-testimonial");
        // $adjust.appendChild($left);
        $adjust.appendChild($right);
        $buttonCont.appendChild($adjust);
        $fragment.appendChild($buttonCont);
        d.querySelector(".testimonial").appendChild($fragment);
  
        const $testiDiv = d.createElement("DIV");
        // const $testImg = d.createElement("IMG");
        // $testImg.src = testimonial.location;
        // $testImg.alt = testimonial.name;
        $testiDiv.classList.add("testimonial__img-div");
        // $testImg.classList.add("testimonial__img-big");
        // $testiDiv.appendChild($testImg);
        $fragment.appendChild($testiDiv);
        d.querySelector(".testimonial").appendChild($fragment);
      }
    } catch (e) {
      const $modalErr = d.createElement("div");
      $modalErr.classList.add("modal-err");
      $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
      d.querySelector("header").insertAdjacentElement("beforebegin", $modalErr);
    }
  }else{
    try {
      if (request.ok) {
        const testimonial = json[1].shift();
        const testimonials = json[1];
        const $template = d.querySelector(".testimonial__template").content;
  
        testimonials.forEach((el, ind) => {
          const $resume = $template.querySelector(".testimonial__text");
          $resume.innerHTML = el.resume;
          const $date = $template.querySelector(".testimonial__date");
          $date.innerHTML = el.date;
          const $img = $template.querySelector(".testimonial__img");
          $img.src = el.location;
          $img.alt = `${el.name}, ${el.jobTitle}`;
          const $name = $template.querySelector(".testimonial__name");
          $name.innerHTML = el.name;
          const $job = $template.querySelector(".testimonial__job");
          $job.innerHTML = el.jobTitle;
  
          const $clone = d.importNode($template, true);
          $fragment.appendChild($clone);
        });
        d.querySelector(".testimonial__global").appendChild($fragment);
        d.querySelector(".testimonial__global").firstElementChild.classList.add(
          "display-block"
        );
  
        const $buttonCont = d.createElement("DIV");
        $buttonCont.classList.add("testimonial__buttons");
        const $adjust = d.createElement("DIV");
        $adjust.classList.add("testimonial__adjust");
        // const $left = d.createElement("I");
        // $left.classList.add("bx", "bx-left-arrow-alt", "change-testimonial");
        const $right = d.createElement("I");
        $right.classList.add("bx", "bx-left-arrow-alt", "change-testimonial");
        // $adjust.appendChild($left);
        $adjust.appendChild($right);
        $buttonCont.appendChild($adjust);
        $fragment.appendChild($buttonCont);
        d.querySelector(".testimonial").appendChild($fragment);
  
        const $testiDiv = d.createElement("DIV");
        const $testImg = d.createElement("IMG");
        $testImg.src = testimonial.location;
        $testImg.alt = testimonial.name;
        $testiDiv.classList.add("testimonial__img-div");
        $testImg.classList.add("testimonial__img-big");
        $testiDiv.appendChild($testImg);
        $fragment.appendChild($testiDiv);
        d.querySelector(".testimonial").appendChild($fragment);
      }
    } catch (e) {
      const $modalErr = d.createElement("div");
      $modalErr.classList.add("modal-err");
      $modalErr.textContent = `Sorry, we have problems. Reload the page, please`;
      d.querySelector("header").insertAdjacentElement("beforebegin", $modalErr);
    }
  }
})();

d.addEventListener("click", (e) => {
  if (e.target.matches(".bx-left-arrow-alt")) {
    const $global = e.target
      .closest(".testimonial__buttons")
      .previousElementSibling.querySelectorAll(".testimonial__container");
    for (let el of $global) {
      if (el.classList[1] === "display-block") {
        if (el.nextElementSibling === null) {
          el.closest(".testimonial__global").firstElementChild.classList.add(
            "display-block"
          );
        }
        el.classList.remove("display-block");
        if (el.nextElementSibling !== null)
          el.nextElementSibling.classList.add("display-block");
        break;
      }
    }
  }

  // if (e.target.matches(".bx-left-arrow-alt")) {
  //   const $global = e.target
  //     .closest(".testimonial__buttons")
  //     .previousElementSibling.querySelectorAll(".testimonial__container");
  //   for (let el of $global) {
  //     if (el.classList[1] === "display-block") {
  //       if (el.previousElementSibling === null) {
  //         el.closest(".testimonial__global").lastElementChild.classList.add(
  //           "display-block"
  //         );
  //       }
  //       el.classList.remove("display-block");
  //       if (el.previousElementSibling !== null)
  //         el.previousElementSibling.classList.add("display-block");
  //       break;
  // }
  // }
  // }
});
// END Testimonial

// New
(async function () {
  const request = await fetch("./assets/json/watches.json");
  const json = await request.json();
  const watches = json[0];
  const $global = d.querySelector(".new__global");

  if (request.ok) {
    watches.forEach((el) => {
      if (el.location.includes("new") === true) {
        const array = [];
        const $container = d.createElement("DIV");
        $container.classList.add("swiper-slide", "new__container");

        const $new = d.createElement("DIV");
        $new.classList.add("new__new");
        $new.textContent = "NEW";
        array.push($new);

        const $img = d.createElement("IMG");
        $img.classList.add("new__img");
        $img.src = el.location;
        $img.alt = el.name;
        array.push($img);

        const $name = d.createElement("H3");
        $name.classList.add("new__name");
        $name.innerHTML = el.name;
        array.push($name);

        const $price = d.createElement("SPAN");
        $price.classList.add("new__price");
        $price.innerHTML = el.price;
        array.push($price);

        const $button = d.createElement("BUTTON");
        $button.classList.add("new__buy");
        $button.textContent = "ADD TO CART";
        $button.dataset.id = el.id;
        array.push($button);

        array.forEach((el) => $container.appendChild(el));
        $fragment.appendChild($container);
      }
    });
    $global.appendChild($fragment);

    //   // const $buttonCont = d.createElement("DIV");
    //   // $buttonCont.classList.add("testimonial__buttons");
    //   // const $adjust = d.createElement("DIV");
    //   // $adjust.classList.add("testimonial__adjust", "new__swiper");
    //   // const $left = d.createElement("span");
    //   // $left.classList.add("swiper-button-prev");
    //   // const $right = d.createElement("span");
    //   // $right.classList.add("swiper-button-next", "new__swiper");
    //   // $adjust.appendChild($left);
    //   // $adjust.appendChild($right);
    //   // $buttonCont.appendChild($adjust);
    //   // $fragment.appendChild($buttonCont);
    //   d.querySelector(".new__container-swiper").appendChild($fragment);
  }
})();

if (!mqlBig.matches){
  d.addEventListener("click", (e) => {
    const theme = localStorage.getItem("themes").split('"')[3];
  
    if (theme === "light") {
      const $cards = d.querySelectorAll(".new__container");
      $cards.forEach((card) => {
        const $cardChilds = card.querySelectorAll("*");
        $cardChilds.forEach((el) => {
          if (e.target === el && e.target.textContent !== "ADD TO CART") {
            const $padre = e.target.closest(".new__container");
            const $divNone = $padre.querySelector(".new__buy");
  
            $divNone.classList.toggle("new__buy-visibility");
            $divNone.classList.toggle("button");
            $padre.classList.toggle("new__container-active");
            $padre.querySelector(".new__new").classList.toggle("new__new-active");
            $padre
              .querySelector(".new__price")
              .classList.toggle("new__price-active");
          }
        });
      });
    }
  
    if (theme === "dark") {
      const $cards = d.querySelectorAll(".new__container");
      $cards.forEach((card) => {
        const $cardChilds = card.querySelectorAll("*");
        $cardChilds.forEach((el) => {
          if (e.target === el && e.target.textContent !== "ADD TO CART") {
            const $padre = e.target.closest(".new__container");
            const $divNone = $padre.querySelector(".new__buy");
  
            $divNone.classList.toggle("new__buy-visibility");
            $divNone.classList.toggle("button");
            $padre.classList.toggle("new__container-active");
            $padre.querySelector(".new__new").classList.toggle("new__new-active");
            $padre
              .querySelector(".new__price")
              .classList.toggle("new__price-active");
          }
        });
      });
    }
  });
}

let newSwiper = new Swiper(".swiper", {
  spaceBetween: 24,
  loop: true,

  breakpoints: {
    1024: {
      slidesPerView: 2,
    },
    1280: {
      slidesPerView: 3,
    }
  },
});
//END New

//Newsletter
d.querySelector(".newsletter__submit").addEventListener("click", (e) => {
  e.preventDefault();
  location.reload();
});
//END Newsletter
