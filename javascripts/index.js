new Vue({
  el: '#app',
  data: {
    gwmAdvantage: '?',
    noGwmAdvantage: '?',
    gwmNoAdvantage: '?',
    noGwmNoAdvantage: '?',
    alwaysGwmAdvantage: '?',
    alwaysGwmNoAdvantage: '?',
    neverGwmAdvantage: '?',
    neverGwmNoAdvantage: '?',
    target: '8',
    damage: '1d8+6',
    health: '25'
  },
  methods: {
    calculate: function () {
      var target = parseInt(this.target);
      var health = parseInt(this.health);
      this.gwmAdvantage = optimize(health, this.damage, true, target, true).toFixed(2);
      this.noGwmAdvantage = optimize(health, this.damage, false, target, true).toFixed(2);
      this.gwmNoAdvantage = optimize(health, this.damage, true, target, false).toFixed(2);
      this.noGwmNoAdvantage = optimize(health, this.damage, false, target, false).toFixed(2);
      this.alwaysGwmAdvantage = alwaysGWM(health, this.damage, target, true).toFixed(2);
      this.alwaysGwmNoAdvantage = alwaysGWM(health, this.damage, target, false).toFixed(2);
      this.neverGwmAdvantage = neverGWM(health, this.damage, target, true).toFixed(2);
      this.neverGwmNoAdvantage = neverGWM(health, this.damage, target, false).toFixed(2);
    }
  }
});

var schema = {
  gwm: true,
  advantage: false,
  damage: '1d10+6',
  health: 27,
  target: 8
};

function combinePDF(pdf1, pdf2) {
  var result = {};
  for (roll1 in pdf1) {
    for (roll2 in pdf2) {
      var k = roll1 - (-1 * roll2)
      result[k] = (result[k] || 0) + pdf1[roll1] * pdf2[roll2];
    }
  }
  return result;
}

function createPDF(sides) {
  var pdf = {};
  for (var i = 1; i <= sides; i++) {
    pdf[i] = 1 / sides;
  }
  return pdf;
}

function roll(amount) {
  var split = amount.split("d");
  var number;
  var sides;
  if (split.length == 1) {
    var pdf = {};
    pdf[parseInt(amount)] = 1;
  } else {
    number = split[0] == "" ? 1 : parseInt(split[0]);
    sides = parseInt(split[1]);
    var pdf = createPDF(sides);
    for (var i = 2; i <= number; i++) {
      pdf = combinePDF(pdf, createPDF(sides));
    }
  }
  return pdf;
}

function rollDamage(damage) {
  var sources = damage.split('+');
  var pdf = roll(sources[0]);
  for (var i = 1; i <= sources.length - 1; i++) {
    pdf = combinePDF(pdf, roll(sources[i]))
  }
  return pdf;
}

function chanceToHit(target, advantage) {
  if (advantage) {
    return {20: 0.098,
      19: 0.191,
      18: 0.278,
      17: 0.359,
      16: 0.437,
      15: 0.510,
      14: 0.576,
      13: 0.639,
      12: 0.698,
      11: 0.751,
      10: 0.798,
      9: 0.840,
      8: 0.877,
      7: 0.910,
      6: 0.938,
      5: 0.960,
      4: 0.978,
      3: 0.990,
      2: 0.998,
      1: 1.000}[target] || 0;
  } else {
    return (21 - target) / 20;
  }
}

function optimize(health, damage, gwm, target, advantage) {
  if (health <= 0) {
    return 0;
  }
  var result;
  var newTarget = gwm ? target + 5 : target;
  var hitChance = Math.max(chanceToHit(newTarget, advantage), .05);
  result = 1 / (hitChance);
  var pdf = rollDamage(gwm ? damage + "+10" : damage);
  for (hit in pdf) {
    result += hitChance * pdf[hit] * Math.min(
      optimize(health - hit, damage, true, target, advantage), 
      optimize(health - hit, damage, false, target, advantage)
    );
  }
  return result;
}

function neverGWM(health, damage, target, advantage) {
  if (health <= 0) {
    return 0;
  }
  var result;
  var hitChance = Math.max(chanceToHit(target, advantage), .05);
  result = 1 / (hitChance);
  var pdf = rollDamage(damage);
  for (hit in pdf) {
    result += hitChance * pdf[hit] * neverGWM(health - hit, damage, target, advantage);
  }
  return result;
}

function alwaysGWM(health, damage, target, advantage) {
  if (health <= 0) {
    return 0;
  }
  var result;
  var newTarget = target + 5
  var hitChance = Math.max(chanceToHit(newTarget, advantage), .05);
  result = 1 / (hitChance);
  var pdf = rollDamage(damage + "+10");
  for (hit in pdf) {
    result += hitChance * pdf[hit] * alwaysGWM(health - hit, damage, target, advantage);
  }
  return result;
}

