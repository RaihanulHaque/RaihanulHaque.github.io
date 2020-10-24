let options = {
  startAngle: -1.55,
  size: 150,
  value: 0.85,
  fill: {gradient: ['#a445b2', '#fa4299']}
  }
  $(".circle .bar").circleProgress(options).on('circle-animation-progress',
  function(event, progress, stepValue){
  $(this).parent().find("span").text(String(stepValue.toFixed(2).substr(2)) + "%");
  });
  $(".html .bar").circleProgress({
  value: 0.90
  });
  $(".js .bar").circleProgress({
  value: 0.70
  });
  $(".py .bar").circleProgress({
  value: 0.85
  });
  $(".flask .bar").circleProgress({
  value: 0.80
  });
  $(".sql .bar").circleProgress({
  value: 0.90
  });