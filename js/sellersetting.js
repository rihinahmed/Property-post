  // Global variables
  let isFormDirty = false;
  const formData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8901',
      licenseNumber: 'RE123456789',
      address: '123 Main St, City, State 12345',
      bio: 'Experienced real estate professional with over 10 years in the industry.',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      emailNotify: true,
      smsNotify: false
  };

  // Profile picture upload functionality
  const profileUpload = document.getElementById('profile-upload');
  const profilePicture = document.getElementById('profile-picture');

  profileUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
              showMessage('File size must be less than 5MB', 'error');
              return;
          }

          // Validate file type
          if (!file.type.startsWith('image/')) {
              showMessage('Please select a valid image file', 'error');
              return;
          }

          const reader = new FileReader();
          reader.onload = function(e) {
              profilePicture.innerHTML = `<img src="${e.target.result}" alt="Profile">`;
              
              // Add upload animation
              profilePicture.style.transform = 'scale(1.2)';
              setTimeout(() => {
                  profilePicture.style.transform = 'scale(1)';
              }, 300);

              // Create ripple effect
              createRipple(profilePicture);
              isFormDirty = true;
          };
          reader.readAsDataURL(file);
      }
  });

  // Form submission with validation
  const settingsForm = document.getElementById('settings-form');
  const saveBtn = document.getElementById('save-btn');
  const loadingSpinner = saveBtn.querySelector('.loading-spinner');
  const btnText = saveBtn.querySelector('.btn-text');

  settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validate form
      if (!validateForm()) {
          return;
      }

      // Show loading state
      loadingSpinner.style.display = 'block';
      btnText.textContent = 'Saving...';
      saveBtn.disabled = true;

      // Simulate API call
      setTimeout(() => {
          // Collect form data
          const formDataObj = new FormData(settingsForm);
          const data = Object.fromEntries(formDataObj.entries());
          
          // Add checkbox values
          data.emailNotify = document.getElementById('email-notify').checked;
          data.smsNotify = document.getElementById('sms-notify').checked;
          
          console.log('Settings saved:', data);
          
          // Update stored form data
          Object.assign(formData, data);
          isFormDirty = false;

          // Hide loading state
          loadingSpinner.style.display = 'none';
          btnText.textContent = 'Save Changes';
          saveBtn.disabled = false;
          
          // Show success message
          showMessage('Settings saved successfully!', 'success');
          
          // Add button success animation
          saveBtn.style.transform = 'scale(0.95)';
          setTimeout(() => {
              saveBtn.style.transform = 'scale(1)';
          }, 150);
      }, 2000);
  });

  // Reset form functionality
  settingsForm.addEventListener('reset', function(e) {
      setTimeout(() => {
          // Reset profile picture
          profilePicture.innerHTML = '<i class="fas fa-camera"></i>';
          
          // Reset form to original values
          document.getElementById('full-name').value = formData.fullName;
          document.getElementById('email').value = formData.email;
          document.getElementById('phone').value = formData.phone;
          document.getElementById('license-number').value = formData.licenseNumber;
          document.getElementById('address').value = formData.address;
          document.getElementById('bio').value = formData.bio;
          document.getElementById('current-password').value = '';
          document.getElementById('new-password').value = '';
          document.getElementById('confirm-password').value = '';
          document.getElementById('email-notify').checked = formData.emailNotify;
          document.getElementById('sms-notify').checked = formData.smsNotify;
          
          // Add reset animation
          const inputs = document.querySelectorAll('input, textarea');
          inputs.forEach((input, index) => {
              input.style.opacity = '0.5';
              setTimeout(() => {
                  input.style.opacity = '1';
              }, index * 50);
          });

          isFormDirty = false;
      }, 10);
  });

  // Form validation
  function validateForm() {
      const requiredFields = ['full-name', 'email'];
      let isValid = true;

      requiredFields.forEach(fieldId => {
          const field = document.getElementById(fieldId);
          if (!field.value.trim()) {
              showFieldError(field, 'This field is required');
              isValid = false;
          } else {
              clearFieldError(field);
          }
      });

      // Email validation
      const emailField = document.getElementById('email');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailField.value && !emailPattern.test(emailField.value)) {
          showFieldError(emailField, 'Please enter a valid email address');
          isValid = false;
      }

      // Password validation
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (newPassword || confirmPassword) {
          const currentPassword = document.getElementById('current-password').value;
          
          if (!currentPassword) {
              showFieldError(document.getElementById('current-password'), 'Current password is required');
              isValid = false;
          }
          
          if (newPassword.length < 8) {
              showFieldError(document.getElementById('new-password'), 'Password must be at least 8 characters');
              isValid = false;
          }
          
          if (newPassword !== confirmPassword) {
              showFieldError(document.getElementById('confirm-password'), 'Passwords do not match');
              isValid = false;
          }
      }

      return isValid;
  }

  function showFieldError(field, message) {
      clearFieldError(field);
      field.style.borderColor = '#ff4d4d';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      errorDiv.style.cssText = `
          color: #ff4d4d;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          animation: fadeInUp 0.3s ease;
      `;
      
      field.parentElement.appendChild(errorDiv);
  }

  function clearFieldError(field) {
      field.style.borderColor = 'transparent';
      const errorMessage = field.parentElement.querySelector('.error-message');
      if (errorMessage) {
          errorMessage.remove();
      }
  }

  // Enhanced input focus animations
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
      input.addEventListener('focus', function() {
          this.parentElement.style.transform = 'translateY(-3px)';
          createInputGlow(this);
      });
      
      input.addEventListener('blur', function() {
          this.parentElement.style.transform = 'translateY(0)';
          clearFieldError(this);
      });

      input.addEventListener('input', function() {
          isFormDirty = true;
          clearFieldError(this);
      });
  });

  function createInputGlow(input) {
      input.style.boxShadow = `0 0 20px ${getComputedStyle(document.documentElement).getPropertyValue('--card-glow')}, inset 0 0 20px rgba(79, 195, 247, 0.1)`;
      
      setTimeout(() => {
          input.addEventListener('blur', function removeGlow() {
              input.style.boxShadow = '';
              input.removeEventListener('blur', removeGlow);
          }, { once: true });
      }, 100);
  }

  // Sidebar hover animations with enhanced effects
  const navLinks = document.querySelectorAll('.sidebar nav a');
  navLinks.forEach(link => {
      link.addEventListener('mouseenter', function() {
          this.style.boxShadow = '0 8px 25px rgba(79, 195, 247, 0.4)';
          createRipple(this);
      });
      
      link.addEventListener('mouseleave', function() {
          this.style.boxShadow = 'none';
      });
  });

  // Password strength indicator
  const newPasswordField = document.getElementById('new-password');
  const confirmPasswordField = document.getElementById('confirm-password');

  newPasswordField.addEventListener('input', function() {
      const strength = calculatePasswordStrength(this.value);
      updatePasswordStrengthUI(this, strength);
  });

  confirmPasswordField.addEventListener('input', function() {
      const match = this.value === newPasswordField.value && this.value !== '';
      this.style.borderColor = match ? 'var(--primary-color)' : (this.value ? '#ff6b6b' : 'transparent');
  });

  function calculatePasswordStrength(password) {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      return strength;
  }

  function updatePasswordStrengthUI(input, strength) {
      const colors = ['#ff4d4d', '#ff8c00', '#ffd700', '#9acd32', '#32cd32'];
      const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
      
      if (input.value === '') {
          input.style.borderColor = 'transparent';
          return;
      }
      
      input.style.borderColor = colors[strength - 1] || '#ff4d4d';
      
      // Remove existing strength indicator
      const existingIndicator = input.parentElement.querySelector('.strength-indicator');
      if (existingIndicator) {
          existingIndicator.remove();
      }
      
      // Add strength indicator
      const strengthIndicator = document.createElement('div');
      strengthIndicator.className = 'strength-indicator';
      strengthIndicator.textContent = `Password Strength: ${strengthTexts[strength - 1] || 'Very Weak'}`;
      strengthIndicator.style.cssText = `
          color: ${colors[strength - 1] || '#ff4d4d'};
          font-size: 0.85rem;
          margin-top: 0.5rem;
          animation: fadeInUp 0.3s ease;
      `;
      
      input.parentElement.appendChild(strengthIndicator);
  }

  // Enhanced success/error message system
  function showMessage(message, type = 'success') {
      const messageEl = document.getElementById('success-message');
      const icon = messageEl.querySelector('i');
      const text = messageEl.querySelector('span');
      
      // Update content based on type
      if (type === 'success') {
          icon.className = 'fas fa-check-circle';
          messageEl.style.background = 'linear-gradient(135deg, var(--primary-color), #81d4fa)';
          messageEl.style.color = '#000';
      } else if (type === 'error') {
          icon.className = 'fas fa-exclamation-circle';
          messageEl.style.background = 'linear-gradient(135deg, #ff4d4d, #e03e3e)';
          messageEl.style.color = '#fff';
      }
      
      text.textContent = message;
      
      // Show message with enhanced animation
      messageEl.classList.add('show');
      messageEl.style.transform = 'translateX(0) scale(1.05)';
      
      setTimeout(() => {
          messageEl.style.transform = 'translateX(0) scale(1)';
      }, 100);
      
      setTimeout(() => {
          messageEl.classList.remove('show');
      }, 4000);
  }

  // Ripple effect function
  function createRipple(element) {
      const ripple = document.createElement('div');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(79, 195, 247, 0.3);
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          width: ${size}px;
          height: ${size}px;
          left: 50%;
          top: 50%;
          margin-left: ${-size/2}px;
          margin-top: ${-size/2}px;
          pointer-events: none;
      `;
      
      const style = document.createElement('style');
      style.textContent = `
          @keyframes ripple {
              to {
                  transform: scale(2);
                  opacity: 0;
              }
          }
      `;
      
      if (!document.querySelector('style[data-ripple]')) {
          style.setAttribute('data-ripple', 'true');
          document.head.appendChild(style);
      }
      
      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);
      
      setTimeout(() => {
          if (ripple.parentNode) {
              ripple.parentNode.removeChild(ripple);
          }
      }, 600);
  }

  // Mobile sidebar toggle
  function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('open');
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(e) {
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.querySelector('.menu-toggle');
      
      if (window.innerWidth <= 1024 && 
          !sidebar.contains(e.target) && 
          !menuToggle.contains(e.target) && 
          sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
      }
  });

  // Warn user about unsaved changes
  window.addEventListener('beforeunload', function(e) {
      if (isFormDirty) {
          e.preventDefault();
          e.returnValue = '';
          return 'You have unsaved changes. Are you sure you want to leave?';
      }
  });

  // Auto-save draft functionality (optional)
  let autoSaveTimeout;
  inputs.forEach(input => {
      input.addEventListener('input', function() {
          clearTimeout(autoSaveTimeout);
          autoSaveTimeout = setTimeout(() => {
              // Save draft to localStorage
              const draftData = {
                  fullName: document.getElementById('full-name').value,
                  email: document.getElementById('email').value,
                  phone: document.getElementById('phone').value,
                  licenseNumber: document.getElementById('license-number').value,
                  address: document.getElementById('address').value,
                  bio: document.getElementById('bio').value,
                  emailNotify: document.getElementById('email-notify').checked,
                  smsNotify: document.getElementById('sms-notify').checked
              };
              localStorage.setItem('settingsDraft', JSON.stringify(draftData));
          }, 2000);
      });
  });

  // Load draft on page load
  window.addEventListener('load', function() {
      const draft = localStorage.getItem('settingsDraft');
      if (draft) {
          const draftData = JSON.parse(draft);
          // Only load draft if it's different from current values
          if (JSON.stringify(draftData) !== JSON.stringify(formData)) {
              Object.keys(draftData).forEach(key => {
                  const element = document.querySelector(`[name="${key}"], #${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
                  if (element) {
                      if (element.type === 'checkbox') {
                          element.checked = draftData[key];
                      } else {
                          element.value = draftData[key];
                      }
                  }
              });
          }
      }
  });

  // Clear draft when form is successfully saved
  settingsForm.addEventListener('submit', function() {
      setTimeout(() => {
          localStorage.removeItem('settingsDraft');
      }, 2000);
  });