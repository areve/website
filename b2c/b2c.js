// @ts-nocheck
$(() => {
  $("#forgotPassword").attr("tabindex", -1)
  $(".helpLink").attr("tabindex", -1)
  $("button#cancel").addClass("standard")
  $("button.sendCode").addClass("primary")
  $("button.verifyCode").addClass("primary")

  if ($('#createAccount').length) {
    const cancel = $('<button type="button">Cancel</button>')
    cancel.click(() => {
      document.location = 'https://www.challen.info/#/azure-b2c'
    })
    cancel.insertAfter('button[form="localAccountForm"]')
  }
})
