// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt


// shopping cart
frappe.provide("webshop.webshop.shopping_cart");
var shopping_cart = webshop.webshop.shopping_cart;

$.extend(shopping_cart, {
	show_error: function(title, text) {
		$("#cart-container").html('<div class="msg-box"><h4>' +
			title + '</h4><p class="text-muted">' + text + '</p></div>');
	},

	bind_events: function() {
		shopping_cart.bind_shipping_rule_dialog();
		shopping_cart.bind_address_picker_dialog();
		shopping_cart.bind_place_order();
		shopping_cart.bind_request_quotation();
		shopping_cart.bind_change_qty();
		shopping_cart.bind_remove_cart_item();
		shopping_cart.bind_change_notes();
		shopping_cart.bind_change_delivery_date();
		shopping_cart.bind_coupon_code();
	},

	bind_address_picker_dialog: function() {
		const d = this.get_update_address_dialog();
		this.parent.find('.btn-change-address').on('click', (e) => {
			const type = $(e.currentTarget).parents('.addresses-container').attr('data-address-type');
			$(d.get_field('address_picker').wrapper).html(
				this.get_address_template(type)
			);
			d.show();
		});
	},

	get_update_address_dialog() {
		let d = new frappe.ui.Dialog({
			title: __("Choisir l'adresse"),
			fields: [{
				'fieldtype': 'HTML',
				'fieldname': 'address_picker',
			}],
			primary_action_label: __("Définir l'adresse"),
			primary_action: () => {
				const $card = d.$wrapper.find('.address-card.active');
				const address_type = $card.closest('[data-address-type]').attr('data-address-type');
				const address_name = $card.closest('[data-address-name]').attr('data-address-name');
				frappe.call({
					type: "POST",
					method: "webshop.webshop.shopping_cart.cart.update_cart_address",
					freeze: true,
					args: {
						address_type,
						address_name
					},
					callback: function(r) {
						d.hide();
						if (!r.exc) {
							$(".cart-tax-items").html(r.message.total);
							shopping_cart.parent.find(
								`.addresses-container[data-address-type="${address_type}"]`
							).find(".callback-container").html(r.message.address);
						}
					}
				});
			}
		});

		return d;
	},

	get_address_template(type) {
		return {
			shipping: `<div class="mb-3" data-section="shipping-address">
				<div class="row no-gutters" data-fieldname="shipping_address_name">
					{% for address in shipping_addresses %}
						<div class="mr-3 mb-3 w-100" data-address-name="{{address.name}}" data-address-type="shipping"
							{% if doc.shipping_address_name == address.name %} data-active {% endif %}>
							{% include "templates/includes/cart/address_picker_card.html" %}
						</div>
					{% endfor %}
				</div>
				<a href="/address/new?address_type=Shipping" class="btn btn-outline-primary btn-sm mt-3 btn-new-address">Ajouter une nouvelle adresse</a>
			</div>`,
			billing: `<div class="mb-3" data-section="billing-address">
				<div class="row no-gutters" data-fieldname="customer_address">
					{% for address in billing_addresses %}
						<div class="mr-3 mb-3 w-100" data-address-name="{{address.name}}" data-address-type="billing"
							{% if doc.customer_address == address.name %} data-active {% endif %}>
							{% include "templates/includes/cart/address_picker_card.html" %}
						</div>
					{% endfor %}
				</div>
				<a href="/address/new?address_type=Billing" class="btn btn-outline-primary btn-sm mt-3 btn-new-address">Ajouter une nouvelle adresse</a>
			</div>`,
			click_n_collect: `<div class="mb-3" data-section="click-n-collect-address">
				<div class="row no-gutters" data-fieldname="shipping_address_name">
					{% for address in click_n_collect_addresses %}
						<div class="mr-3 mb-3 w-100" data-address-name="{{address.name}}" data-address-type="click_n_collect"
							{% if doc.shipping_address_name == address.name %} data-active {% endif %}>
							{% include "templates/includes/cart/address_picker_card_wh.html" %}
						</div>
					{% endfor %}
				</div>
			</div>`,
		}[type];
	},

	bind_shipping_rule_dialog: function() {
		const d = this.get_update_shipping_rule_dialog();
		this.parent.find('.btn-change-shipping-rule').on('click', (e) => {
			$(d.get_field('shipping_rule_picker').wrapper).html(
				this.get_shipping_rule_template()
			);
			d.show();
		});
	},
	get_update_shipping_rule_dialog: function() {
		let d = new frappe.ui.Dialog({
			title: __("Choisir la règle de livraison"),
			fields: [{
				'fieldtype': 'HTML',
				'fieldname': 'shipping_rule_picker',
			}],
			primary_action_label: __('Choisir la règle de livraison'),
			primary_action: () => {
				const $card = d.$wrapper.find('.shipping-card.active');
				const shipping_rule_name = $card.closest('[data-shipping-rule-name]').attr('data-shipping-rule-name');
				frappe.call({
					type: "POST",
					method: "webshop.webshop.shopping_cart.cart.apply_shipping_rule",
					freeze: true,
					args: { shipping_rule: shipping_rule_name },
					callback: function(r) {
						d.hide();
						if (!r.exc) {
							$(".cart-tax-items").html(r.message.taxes);
							shopping_cart.parent
								.find(".shipping-rules-container")
								.find(".callback-container")
								.html(r.message.shipping_rule);
							shopping_cart.parent.find(".cart-addresses").html(r.message.cart_address);
							shopping_cart.bind_address_picker_dialog();
							$(".btn-update-addresses").trigger("click");
						}
					}
				});
			}
		});

		return d;

	},
	get_shipping_rule_template() {
		return `<div class="mb-3" data-section="shipping-rule">
				<div class="row no-gutters" data-fieldname="shipping_rule_name">
					{% set shipping_rules = frappe.db.get_all('Shipping Rule', fields=['name', 'description', 'avaible_for_website', 'click_n_collect'], filters={"avaible_for_website": True})%}
					{% for rule in shipping_rules %}
						<div class="mr-3 mb-3 w-100" data-shipping-rule-name="{{rule.name}}" {% if rule.click_n_collect == 1 %} data-click-n-collect {% endif %} {% if doc.shipping_rule == rule.name %} data-active {% endif %}>
							{% include "templates/includes/cart/shipping_rule_picker_card.html" %}
						</div>
					{% endfor %}
				</div>
			</div>`
	},


	bind_place_order: function() {
		$(".btn-place-order").on("click", function() {
			const billing_address = $('[data-fieldname="customer_address"]').find('.address-container').is('[data-active]');
			const shipping_address = $('[data-fieldname="shipping_address_name"]').find('.address-container').is('[data-active]');
			const shipping_rule = $('[data-shipping-rule-name]').is('[data-active]');
			const input_same_billing = $('#input_same_billing').is(':checked');
			if (Boolean(shipping_address) && Boolean(shipping_rule)) {
				if (Boolean(billing_address)) { shopping_cart.place_order(this) }
				else if (Boolean(input_same_billing)) { shopping_cart.place_order(this) }
				else { frappe.throw("{{_('Please select shipping and addresses')}}") }
			}
			else { frappe.throw("{{_('Please select shipping and addresses')}}") }
		});
	},

	bind_request_quotation: function() {
		$('.btn-request-for-quotation').on('click', function() {
			shopping_cart.request_quotation(this);
		});
	},

	bind_change_qty: function() {
		// bind update button
		$(".cart-items").on("change", ".cart-qty", function() {
			var item_code = $(this).attr("data-item-code");
			var newVal = $(this).val();
			shopping_cart.shopping_cart_update({item_code, qty: newVal});
		});

		$(".cart-items").on('click', '.number-spinner button', function () {
			var btn = $(this),
				input = btn.closest('.number-spinner').find('input'),
				oldValue = input.val().trim(),
				newVal = 0;

			if (btn.attr('data-dir') == 'up') {
				newVal = parseInt(oldValue) + 1;
			} else {
				if (oldValue > 1) {
					newVal = parseInt(oldValue) - 1;
				}
			}
			input.val(newVal);

			let notes = input.closest("td").siblings().find(".notes").text().trim();
			var item_code = input.attr("data-item-code");
			shopping_cart.shopping_cart_update({
				item_code,
				qty: newVal,
				additional_notes: notes
			});
		});
	},

	bind_change_notes: function() {
		$('.cart-items').on('change', 'textarea', function() {
			const $textarea = $(this);
			const item_code = $textarea.attr('data-item-code');
			const qty = $textarea.closest('tr').find('.cart-qty').val();
			const notes = $textarea.val();
			shopping_cart.shopping_cart_update({
				item_code,
				qty,
				additional_notes: notes
			});
		});
	},

	bind_change_delivery_date: function() {
		var me = this
		var delivery_date = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Datetime',
				fieldname: 'delivery_date',
				label: '{{_("Pick or Delivery Date")}}',
				hide_timezone: true,
			},
			change: function() { 
				var d_date = this.$input.val();
				frappe.call({
					type: "POST",
					method: "webshop.webshop.shopping_cart.cart.update_delivery_date",
					args: { delivery_date: d_date }
				})
			},
			parent: $('#delivery_date'),
			render_input: true
		});
	},



	bind_remove_cart_item: function() {
		$(".cart-items").on("click", ".remove-cart-item", (e) => {
			const $remove_cart_item_btn = $(e.currentTarget);
			var item_code = $remove_cart_item_btn.data("item-code");

			shopping_cart.shopping_cart_update({
				item_code: item_code,
				qty: 0
			});
		});
	},

	render_tax_row: function($cart_taxes, doc, shipping_rules) {
		var shipping_selector;
		if(shipping_rules) {
			shipping_selector = '<select class="form-control">' + $.map(shipping_rules, function(rule) {
				return '<option value="' + rule[0] + '">' + rule[1] + '</option>' }).join("\n") +
			'</select>';
		}

		var $tax_row = $(repl('<div class="row">\
			<div class="col-md-9 col-sm-9">\
				<div class="row">\
					<div class="col-md-9 col-md-offset-3">' +
					(shipping_selector || '<p>%(description)s</p>') +
					'</div>\
				</div>\
			</div>\
			<div class="col-md-3 col-sm-3 text-right">\
				<p' + (shipping_selector ? ' style="margin-top: 5px;"' : "") + '>%(formatted_tax_amount)s</p>\
			</div>\
		</div>', doc)).appendTo($cart_taxes);

		if(shipping_selector) {
			$tax_row.find('select option').each(function(i, opt) {
				if($(opt).html() == doc.description) {
					$(opt).attr("selected", "selected");
				}
			});
			$tax_row.find('select').on("change", function() {
				shopping_cart.apply_shipping_rule($(this).val(), this);
			});
		}
	},

	apply_shipping_rule: function(rule, btn) {
		return frappe.call({
			btn: btn,
			type: "POST",
			method: "webshop.webshop.shopping_cart.cart.apply_shipping_rule",
			args: { shipping_rule: rule },
			callback: function(r) {
				if(!r.exc) {
					shopping_cart.render(r.message);
				}
			}
		});
	},

	place_order: function(btn) {
		return frappe.call({
			type: "POST",
			method: "webshop.webshop.shopping_cart.cart.place_order",
			btn: btn,
			freeze: true,
			callback: function(r) {
				if(r.exc) {
					var msg = "";
					if(r._server_messages) {
						msg = JSON.parse(r._server_messages || []).join("<br>");
					}

					$("#cart-error")
						.empty()
						.html(msg || frappe._("Something went wrong!"))
						.toggle(true);
				} else {
					$(btn).hide();
					window.location.href = '/orders/' + encodeURIComponent(r.message);
				}
			}
		});
	},

	request_quotation: function(btn) {
		return frappe.call({
			type: "POST",
			method: "webshop.webshop.shopping_cart.cart.request_for_quotation",
			freeze: true,
			callback: function(r) {
				if(r.exc) {
					shopping_cart.unfreeze();
					var msg = "";
					if(r._server_messages) {
						msg = JSON.parse(r._server_messages || []).join("<br>");
					}

					$("#cart-error")
						.empty()
						.html(msg || frappe._("Something went wrong!"))
						.toggle(true);
				} else {
					$(btn).hide();
					window.location.href = '/quotations/' + encodeURIComponent(r.message);
				}
			}
		});
	},

	bind_coupon_code: function() {
		$(".bt-coupon").on("click", function() {
			shopping_cart.apply_coupon_code(this);
		});
	},

	apply_coupon_code: function(btn) {
		return frappe.call({
			type: "POST",
			method: "webshop.webshop.shopping_cart.cart.apply_coupon_code",
			btn: btn,
			args : {
				applied_code : $('.txtcoupon').val(),
				applied_referral_sales_partner: $('.txtreferral_sales_partner').val()
			},
			callback: function(r) {
				if (r && r.message){
					location.reload();
				}
			}
		});
	}
});

frappe.ready(function() {
	$(".cart-icon").hide();
	shopping_cart.parent = $(".cart-container");
	shopping_cart.bind_events();
});

function show_terms() {
	var html = $(".cart-terms").html();
	frappe.msgprint(html);
}
