import {select, classNames, templates, settings} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();

    //console.log('new Cart', thisCart);
  }
  // metoda pokazująca i ukrywająca koszyk
  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct){
    const thisCart = this;
    /* generate HTML based on template */
    const generatedHTML = templates.cartProduct(menuProduct);
    /* zamiana html na element DOM */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    /* add element to DOM */
    thisCart.dom.productList.appendChild(generatedDOM);

    //console.log('adding product', menuProduct);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    //console.log('thisCart.products', thisCart.products);

    thisCart.update();
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {}; //referencje do obiektow DOM chowamy w tym obiekcie

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
  }

  update(){
    const thisCart = this;
    // cena dostawy
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.totalNumber = 0;
    // łączna cena
    thisCart.subtotalPrice = 0;

    for(const product of thisCart.products){
      thisCart.totalNumber = thisCart.totalNumber + product.amount;
      thisCart.subtotalPrice = thisCart.subtotalPrice + product.price * product.amount;
    }

    if (thisCart.totalNumber === 0){
      thisCart.deliveryFee = 0;
      thisCart.totalPrice = 0;
    } else {
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    }

    for (let price of thisCart.dom.totalPrice) {
      price.innerHTML = thisCart.totalPrice;
    }

    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee; 
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
  }

  //jak to działa
  remove(product){
    const thisCart = this;
    const indexProduct = thisCart.products.indexOf(product);
    product.dom.wrapper.remove();
    thisCart.products.splice(indexProduct,1);
    thisCart.update();
  }

  sendOrder(){
    const thisCart = this;
    // adres endpointu z którym się łączymy
    const url = settings.db.url + '/' + settings.db.orders;
    // obiekt, dzięki któremu będziemy wysyłać dane do serwera
    const payload = {};
    payload.address = thisCart.dom.address.value;
    payload.phone = thisCart.dom.phone.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = thisCart.deliveryFee;
    payload.products = [];
    console.log(payload);
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    // wysyłanie do serwera
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options);
  }
}

export default Cart;