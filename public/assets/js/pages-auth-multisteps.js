/**
 *  Page auth register multi-steps (customized for BAA UNJANI)
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const stepsValidation = document.querySelector('#multiStepsValidation');
  if (!stepsValidation) return;

  const form = stepsValidation.querySelector('#multiStepsForm');
  const step1 = form.querySelector('#accountStep');
  const step2 = form.querySelector('#securityStep');
  const nextButtons = [].slice.call(form.querySelectorAll('.btn-next'));
  const prevButtons = [].slice.call(form.querySelectorAll('.btn-prev'));

  const stepper = new Stepper(stepsValidation, { linear: true });

  const fvStep1 = FormValidation.formValidation(step1, {
    fields: {
      name: {
        validators: {
          callback: {
            message: 'Nama minimal 2 karakter',
            callback: input => input.value.trim() === '' || input.value.trim().length >= 2
          }
        }
      },
      email: {
        validators: {
          notEmpty: { message: 'Please enter your email' },
          emailAddress: { message: 'Please enter a valid email address' }
        }
      },
      password: {
        validators: {
          notEmpty: { message: 'Please enter your password' },
          stringLength: { min: 6, message: 'Password must be more than 6 characters' }
        }
      },
      confirmPassword: {
        validators: {
          notEmpty: { message: 'Please confirm password' },
          identical: {
            compare: () => step1.querySelector('[name="password"]').value,
            message: 'The password and its confirmation do not match'
          }
        }
      }
    },
    plugins: {
      trigger: new FormValidation.plugins.Trigger(),
      bootstrap5: new FormValidation.plugins.Bootstrap5({
        eleValidClass: '',
        rowSelector: '.form-control-validation'
      }),
      autoFocus: new FormValidation.plugins.AutoFocus(),
      submitButton: new FormValidation.plugins.SubmitButton()
    },
    init: instance => {
      instance.on('plugins.message.placed', e => {
        if (e.element.parentElement.classList.contains('input-group')) {
          e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
        }
      });
    }
  }).on('core.form.valid', function () {
    stepper.next();
  });

  const fvStep2 = FormValidation.formValidation(step2, {
    fields: {
      recaptcha_token: {
        validators: {
          notEmpty: { message: 'Please complete the reCAPTCHA' }
        }
      }
    },
    plugins: {
      trigger: new FormValidation.plugins.Trigger(),
      bootstrap5: new FormValidation.plugins.Bootstrap5({
        eleValidClass: '',
        rowSelector: '.form-control-validation'
      }),
      autoFocus: new FormValidation.plugins.AutoFocus(),
      submitButton: new FormValidation.plugins.SubmitButton(),
      defaultSubmit: new FormValidation.plugins.DefaultSubmit()
    },
    init: instance => {
      instance.on('plugins.message.placed', e => {
        if (e.element.parentElement.classList.contains('input-group')) {
          e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
        }
      });
    }
  });

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (stepper._currentIndex === 0) {
        fvStep1.validate();
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      stepper.previous();
    });
  });

  // Expose to recaptcha callbacks so it can revalidate when token changes
  window.__fvStep2Instance = fvStep2;
});
