import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import Home from './components/Home.js';

const app = {
  initBooking: function () {
    const thisApp = this;

    const bookingWidget = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingWidget);
  },

  initPages: function () {
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    thisApp.pageLinks = document.querySelectorAll('.link a');

    const idFromHash = window.location.hash.replace('#/', '');
    //console.log('idFromHash', idFromHash);

    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }
    //console.log('pageMatchingHash', pageMatchingHash);
    thisApp.activatePage(pageMatchingHash);

    for (let link of thisApp.pageLinks) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        const clickedLink = this;
        const id = clickedLink.getAttribute('href').replace('#', '');

        thisApp.activatePage(id);

        window.location.hash = '#/' + id;
      });
    }

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();

        /* get page id from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');

        /* run thisApp.activatePage with that id	*/
        thisApp.activatePage(id);

        /* chande URL hash */
        window.location.hash = '#/' + id;
      });
    }
  },

  activatePage: function (pageId) {
    const thisApp = this;

    /* add class "active" to matching pages, remove from non matching */
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    /* add class "active" to matching links, remove from non matching */
    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

  initMenu: function () {
    const thisApp = this;
    //console.log('thisApp.data:', thisApp.data);
    //const testProduct = new Product();
    //console.log('testProduct:', testProduct);
    for (let productData in thisApp.data.products) {
      // zmieniamy klucz na w??a??ciwo???? id, ??eby dzia??a??o z serwerem
      new Product(
        thisApp.data.products[productData].id,
        thisApp.data.products[productData]
      );
    }
  },

  initData: function () {
    const thisApp = this;
    thisApp.data = {};
    // adres endpointu do naszego serwera
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        //console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;
        /* execute initMenu method */
        thisApp.initMenu();
      });

    //console.log('thisApp.data', JSON.stringify(thisApp.data));
  },

  init: function () {
    const thisApp = this;
    //console.log('*** App starting ***');
    //console.log('thisApp:', thisApp);
    //console.log('classNames:', classNames);
    //console.log('settings:', settings);
    //console.log('templates:', templates);

    //thisApp.initPages();
    thisApp.initData();
    //thisApp.initMenu(); -> usuwamy i dajemy do parsedResponse
    app.initCart();
    app.initBooking();
    thisApp.initHome();
    thisApp.initPages();
  },
  // instancja klasy Card
  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  },

  initHome: function () {
    const thisApp = this;

    const homeElem = document.querySelector(select.containerOf.home);

    thisApp.home = new Home(homeElem);
  },
};

app.init();
//app.initCart();
