export default function CheckoutPage() {
  return (
    <div>
      <a
        href="https://buy.polar.sh/polar_cl_46YsKFjFA7lK0MBVnu6f6Za8rkRCXjz08jcYN2guia0"
        data-polar-checkout
        data-polar-checkout-theme="dark"
      >
        Purchase
      </a>
      <script
        src="https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.1/dist/embed.global.js"
        defer
        data-auto-init
      ></script>
    </div>
  );
}
