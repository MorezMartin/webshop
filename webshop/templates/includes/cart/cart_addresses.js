frappe.ready(() => {
	$(document).on('click', '.address-card', (e) => {
		const $target = $(e.currentTarget);
		const $section = $target.closest('[data-section]');
		$section.find('.address-card').removeClass('active');
		$target.addClass('active');
	});
	$(document).on('click', '.btn-update-addresses', (e) => {
		console.log("coucou");
		setup_state();
	});
	$(document).on('change', '#input_same_billing', (e) => {
		const $check = $(e.target);
		const billing_address = $('[data-section="billing-address"]')
			.find('[data-address-name][data-active]').attr('data-address-name');
		const shipping_address = $('[data-section="shipping-address"]')
			.find('[data-address-name][data-active]').attr('data-address-name');
		const address_name = $('[data-section="shipping-address"]').find('[data-address-name][data-active]').attr('data-address-name')
		const address_type = $('[data-section="shipping-address"]').find('[data-address-name][data-active]').attr('data-address-type')
		if ($check.is(':checked')) {
			if (!Boolean(shipping_address)) {
				$('#input_same_billing').prop("checked", false).trigger('change');
				frappe.throw('{{_("Please select a delivery address")}}');
				setup_state();
			} else {
				frappe.call({
					type: "POST",
					method: "webshop.webshop.shopping_cart.cart.update_cart_address",
					freeze: true,
					args: {
						address_type: "billing",
						address_name
					},
					callback: function(r) {
						if(!r.exc) {
							$(".cart-tax-items").html(r.message.taxes);
						}
					}
				});
			}
		} else {
			$(`[data-section="billing-address"] [data-address-name="${billing_address}"] .address-card`).removeClass('active');
		}
	toggle_billing_address_section(!$check.is(":checked"));
	});

	$('.btn-new-address').click(() => {
		const d = new frappe.ui.Dialog({
			title: __('New Address'),
			fields: [
				{
					label: __('Address Title'),
					fieldname: 'address_title',
					fieldtype: 'Data',
					reqd: 1
				},
				{
					label: __('Address Line 1'),
					fieldname: 'address_line1',
					fieldtype: 'Data',
					reqd: 1
				},
				{
					label: __('Address Line 2'),
					fieldname: 'address_line2',
					fieldtype: 'Data'
				},
				{
					label: __('City/Town'),
					fieldname: 'city',
					fieldtype: 'Data',
					reqd: 1
				},
				{
					label: __('State'),
					fieldname: 'state',
					fieldtype: 'Data'
				},
				{
					label: __('Country'),
					fieldname: 'country',
					fieldtype: 'Link',
					options: 'Country',
					reqd: 1
				},
				{
					fieldname: "column_break0",
					fieldtype: "Column Break",
					width: "50%"
				},
				{
					label: __('Address Type'),
					fieldname: 'address_type',
					fieldtype: 'Select',
					options: [
						'Billing',
						'Shipping'
					],
					reqd: 1
				},
				{
					label: __('Postal Code'),
					fieldname: 'pincode',
					fieldtype: 'Data'
				},
				{
					fieldname: "phone",
					fieldtype: "Data",
					label: __("Phone")
				},
			],
			primary_action_label: __('Save'),
			primary_action: (values) => {
				frappe.call('webshop.shopping_cart.cart.add_new_address', { doc: values })
					.then(r => {
						frappe.call({
							method: "webshop.shopping_cart.cart.update_cart_address",
							args: {
								address_type: r.message.address_type,
								address_name: r.message.name
							},
							callback: function (r) {
								d.hide();
								window.location.reload();
							}
						});
					});

			}
		})

		d.show();
	});

	function setup_state() {
		const shipping_address = $('[data-section="shipping-address"]')
			.find('[data-address-name][data-active]').attr('data-address-name');

		const billing_address = $('[data-section="billing-address"]')
			.find('[data-address-name][data-active]').attr('data-address-name');

		const cc_address = $('[data-section="click-n-collect-address"]')
			.find('[data-address-name][data-active]').attr('data-address-name');

		const cc = $('[data-shipping-rule-name]').first('[data-active]').is('[data-click-n-collect]')

		const shipping_rule = $('[data-shipping-rule-name]').length

		$('#input_same_billing').prop('checked', false).trigger('change');

		if (shipping_address) {
			$(`[data-section="shipping-address"] [data-address-name="${shipping_address}"] .address-card`).addClass('active');
		}
		if (billing_address) {
			$(`[data-section="billing-address"] [data-address-name="${billing_address}"] .address-card`).addClass('active');
		}
		if (cc_address) {
			$(`[data-section="click-n-collect-address"] [data-address-name="${cc_address}"] .address-card`).addClass('active');
		}
		toggle_cart_addresses(Boolean(shipping_rule));
		toggle_shipping_address_section(!cc);
		toggle_pick_location(cc);
		toggle_same_billing_checkbox(!cc);
	}

	setup_state();

	function toggle_cart_addresses(flag) {
		$('.cart-addresses').toggle(flag);
	}
	function toggle_billing_address_section(flag) {
		$('[data-section="billing-address"]').toggle(flag);
	}
	function toggle_shipping_address_section(flag) {
		$('[data-section="shipping-address"]').toggle(flag);
	}
	function toggle_same_billing_checkbox(flag) {
		$('[data-section="checkbox-same-billing"]').toggle(flag);
	}
	function toggle_pick_location(flag) {
		$('[data-section="click-n-collect-address"]').toggle(flag);
	}
	function toggle_cart_addresses(flag) {
		$('.cart-addresses').toggle(flag);
	}
});
