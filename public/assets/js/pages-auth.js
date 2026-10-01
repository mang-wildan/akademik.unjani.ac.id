/**
 *  Pages Authentication
 */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  (() => {
    const formAuthentication = document.querySelector('#formAuthentication');
    const formRegister = document.querySelector('#formRegister');

    const buildValidation = (formEl, fields) => {
      if (!formEl || typeof FormValidation === 'undefined') return null;

      return FormValidation.formValidation(formEl, {
        fields,
        plugins: {
          trigger: new FormValidation.plugins.Trigger(),
          bootstrap5: new FormValidation.plugins.Bootstrap5({
            eleValidClass: '',
            rowSelector: '.form-control-validation'
          }),
          submitButton: new FormValidation.plugins.SubmitButton(),
          defaultSubmit: new FormValidation.plugins.DefaultSubmit(),
          autoFocus: new FormValidation.plugins.AutoFocus()
        },
        init: instance => {
          instance.on('plugins.message.placed', e => {
            if (e.element.parentElement.classList.contains('input-group')) {
              e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
            }
          });
        }
      });
    };

    // Form validation for Add new record
    buildValidation(formAuthentication, {
      email: {
        validators: {
          notEmpty: {
            message: 'Email wajib diisi'
          },
          emailAddress: {
            message: 'Format email tidak valid'
          }
        }
      },
      password: {
        validators: {
          notEmpty: {
            message: 'Password wajib diisi'
          },
          stringLength: {
            min: 6,
            message: 'Password minimal 6 karakter'
          }
        }
      }
    });

    buildValidation(formRegister, {
      name: {
        validators: {
          stringLength: {
            min: 2,
            message: 'Nama minimal 2 karakter'
          }
        }
      },
      email: {
        validators: {
          notEmpty: {
            message: 'Email wajib diisi'
          },
          emailAddress: {
            message: 'Format email tidak valid'
          }
        }
      },
      password: {
        validators: {
          notEmpty: {
            message: 'Password wajib diisi'
          },
          stringLength: {
            min: 6,
            message: 'Password minimal 6 karakter'
          }
        }
      },
      confirmPassword: {
        validators: {
          notEmpty: {
            message: 'Please confirm password'
          },
          identical: {
            compare: () => formRegister.querySelector('[name="password"]').value,
            message: 'The password and its confirmation do not match'
          }
        }
      }
    });

    // Two Steps Verification for numeral input mask
    const numeralMaskElements = document.querySelectorAll('.numeral-mask');

    // Format function for numeral mask
    const formatNumeral = value => value.replace(/\D/g, ''); // Only keep digits

    if (numeralMaskElements.length > 0) {
      numeralMaskElements.forEach(numeralMaskEl => {
        numeralMaskEl.addEventListener('input', event => {
          numeralMaskEl.value = formatNumeral(event.target.value);
        });
      });
    }
  })();
});
