document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        if (event.target.closest('.favorite-btn')) {
            event.preventDefault();
            
            const favoriteBtn = event.target.closest('.favorite-btn');
            const icon = favoriteBtn.querySelector('i');
            
            if (icon.textContent === 'favorite_border') {
                icon.textContent = 'favorite';
                favoriteBtn.classList.add('favorite-clicked');
            } else {
                icon.textContent = 'favorite_border';
                favoriteBtn.classList.remove('favorite-clicked');
            }
        }
    });
});


document.addEventListener("alpine:init", () => {

    Alpine.data('pizzaCart', () => {
        return {
            header: "Perfect Pizza",
            title: "Shopping Cart",
            pizzas: [],
            username: 'Khanyie1',
            //cardId: 'sp2m0YR0Af',
            cardId: '',
            cartPizzas : [],
            cartTotal: 0.00,
            paymentAmount: 0,
            message: '',
            featuredPizzas:[],
            historicalOrders: [],
            showHistoricalOrders: false,
            showHistoricalOrdersButton: false,

            createCart(){
                const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`
                return axios.get(createCartURL)
                            .then(result => {
                                this.cardId = result.data.cart_code;
                            });
            },

            featuredGet() {
                const featuredURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`
                return axios.get(featuredURL); 
            },

            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cardId}/get`
                return axios.get(getCartURL)
            },

            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = cartData.total.toFixed(2);
                    this.itemTotal 
                })
            },

            addPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cardId,
                    "pizza_id": pizzaId
                }).then(() => true).catch(err=>{
                    console.log(err);
                })
            },

            RemovePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cardId,
                    "pizza_id": pizzaId
                })
            },

            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code" : this.cardId,
                    amount
                })
            },

            init() {
                axios
                    .get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas
                });

                if(!this.cardId) {
                    this
                        .createCart()
                        .then(() => {
                            this.showCartData();
                        }
                    )
                    this.featuredGet().then(res=>{
                        this.featuredPizzas = res.data.pizzas
                    })
                }
            },

            addPizzaToCart(pizzaId) {
                console.log('Adding pizza to cart:', pizzaId);
                this.addPizza(pizzaId)
                    .then(() => {
                        console.log('Pizza added, updating cart data...');
                        this.showCartData();
                    })
                    .then(() => {
                        console.log('Updated cartPizzas:', this.cartPizzas);
                        console.log('Updated cartTotal:', this.cartTotal);
                    })
                    .catch(error => {
                        console.error('Error in addPizzaToCart:', error);
                    });
            },

            removePizzaFromCart(pizzaId) {
                this.RemovePizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    }
                )
            },

            payForCart() {
                this.pay(this.paymentAmount)
                    .then(result => {
                        if ( result.data.status == 'failure' && this.paymentAmount > 0) {
                            this.message = result.data.message + " Sorry - that is not enough money!";
                            setTimeout(() => this.message = '', 4000)

                        } else if (result.data.status == "success" && this.paymentAmount > this.cartTotal) {
                            const change = this.paymentAmount - this.cartTotal;
                            this.message = `Payment received, but you have change of : R${change.toFixed(2)} Enjoy your Pizzas!`

                            let order = {
                                pizzas: [...this.cartPizzas.map(pizza => ({
                                    flavour: pizza.flavour,
                                    price: pizza.price,
                                    qty: pizza.qty
                                }))],
                                total: parseFloat(this.cartTotal),
                                date: new Date().toLocaleDateString()
                            };

                            // Add current cart items to historical orders
                            this.historicalOrders.push(order);

                            setTimeout(() => {
                                this.message = '';
                                this.cartPizzas = [];
                                this.cartTotal = 0.00;
                                this.cardId = '';
                                this.paymentAmount = 0
                                this.createCart();
                            }, 4000)

                        } else if(result.data.status == "success" && this.paymentAmount === this.cartTotal) {
                            this.message = 'Payment received, Enjoy your Pizzas!';

                            setTimeout(() => {
                                this.message = '';
                                this.cartPizzas = [];
                                this.cartTotal = 0.00;
                                this.cardId = '';
                                this.paymentAmount = 0
                                this.createCart();
                            }, 4000)
                        } else if ( result.data.status == 'failure' && this.paymentAmount === 0) {
                            this.message = "Sorry - you have to put amount to pay!";
                            setTimeout(() => this.message = '', 4000)
                        } else if(this.paymentAmount === 0) {
                            this.message = "Your cart is empty, add some items!";
                            setTimeout(() => this.message = '', 4000)
                        }

                        this.showHistoricalOrdersButton = true;
                    }
                )
            },

            toggleFavorite(id) {
                const pizza = this.pizzas.find(p => p.id === id);
                if (pizza) {
                    pizza.isFavorite = !pizza.isFavorite;
                }
            },

            toggleHistoricalOrders() {
                this.showHistoricalOrders = !this.showHistoricalOrders;
            }
        }
    })
})


