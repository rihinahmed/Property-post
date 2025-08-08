document.addEventListener('click', function (e) {
    const count = 10;
    const sparkColor = '#6366f2'; // Matches your theme
    const size = 6;
    const radius = 40;
    const duration = 600;

    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.style.position = 'absolute';
      spark.style.width = 4 + 'px';
      spark.style.height = 4 + 'px';
      spark.style.borderRadius = '50%';
      spark.style.backgroundColor = sparkColor;
      spark.style.pointerEvents = 'none';
      spark.style.zIndex = '9999';

      // Correct position on the full page
      const pageX = e.pageX;
      const pageY = e.pageY;

      const angle = (2 * Math.PI * i) / count;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      spark.style.left = pageX + 'px';
      spark.style.top = pageY + 'px';

      document.body.appendChild(spark);

      spark.animate(
        [
          { transform: 'translate(0, 0)', opacity: 1 },
          { transform: `translate(${x}px, ${y}px)`, opacity: 0 }
        ],
        {
          duration: duration,
          easing: 'ease-out'
        }
      );

      setTimeout(() => spark.remove(), duration);
    }
  });