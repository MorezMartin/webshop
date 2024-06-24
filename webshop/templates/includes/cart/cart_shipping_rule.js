frappe.ready(() => {
	$(document).on('click', '.shipping-card', (e) => {
		const $target = $(e.currentTarget);
		const $section = $target.closest('[data-section]');
		$section.find('.shipping-card').removeClass('active');
		$target.addClass('active');
	});
	function setup_state_sr() {
		const shipping_rule = $('[data-section="shipping-rule"]').find('[data-shipping-rule-name][data-active]').attr('data-shipping-rule-name')
		if (shipping_rule) {
			$(`[data-section="shipping-rule"] [data-shipping-rule-name="${shipping_rule}"] .shipping-card`).addClass('active');
		}
	}
	setup_state_sr();
})
