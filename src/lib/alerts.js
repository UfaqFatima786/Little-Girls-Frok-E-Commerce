import SweetAlert from "sweetalert2";

const Swal = SweetAlert.mixin({
  customClass: {
    popup: "lp-swal-popup",
    title: "lp-swal-title",
    htmlContainer: "lp-swal-content",
    actions: "lp-swal-actions",
    confirmButton: "lp-swal-confirm",
    cancelButton: "lp-swal-cancel",
    denyButton: "lp-swal-deny",
  },
  buttonsStyling: false,
  iconColor: "#bd4078",
});

export default Swal;
