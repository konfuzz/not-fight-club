class Enemy {
  constructor({ name, initHealth, health, minDamage, maxDamage, critChance, dodgeChance, defence, hits, blocks, avatar, rewards }) {
    this.minDamage = minDamage;
    this.maxDamage = maxDamage;
    this.critChance = critChance;
    this.dodgeChance = dodgeChance;
    this.defence = defence;
    this.name = name;
    this.initHealth = initHealth;
    this.health = health || this.initHealth;
    this.hits = hits;
    this.blocks = blocks;
    this.avatar = avatar;
    this.rewards = rewards;
  }
}
class Char {
  constructor({ name, stats = { strength: 5, agility: 5, luck: 5, endurance: 5 }, health, level = 0, hits = 1, blocks = 2, wins = 0, losses = 0, draws = 0, avatar = './assets/images/chars/paladin.png', gold = 0, exp = 0, rewards = { exp: 50, gold: 100 }, items, equippedItems }) {
    console.log(items, equippedItems);
    this.name = name;
    this.stats = stats;
    this.equippedItems = equippedItems || [];
    this.initHealth = stats.endurance * 10 + this.equippedItems.reduce((acc, item) => acc + (item.stats.health || 0), 0);
    this.health = health || this.initHealth;
    this.minDamage = stats.strength + this.equippedItems.reduce((acc, item) => acc + (item.stats.minDamage || 0), 0);
    this.maxDamage = stats.strength + 5 + this.equippedItems.reduce((acc, item) => acc + (item.stats.maxDamage || 0), 0);
    this.critChance = stats.luck + this.equippedItems.reduce((acc, item) => acc + (item.stats.critChance || 0), 0);
    this.dodgeChance = stats.agility + this.equippedItems.reduce((acc, item) => acc + (item.stats.dodgeChance || 0), 0);
    this.initHits = 1;
    this.initBlocks = 2;
    this.hits = this.initHits + this.equippedItems.reduce((acc, item) => acc + (item.stats.hits || 0), 0);
    this.blocks = this.initBlocks + this.equippedItems.reduce((acc, item) => acc + (item.stats.blocks || 0), 0);
    this.wins = wins;
    this.losses = losses;
    this.draws = draws;
    this.avatar = avatar;
    this.exp = exp;
    this.level = this.exp < 25 ? 0 : Math.floor(Math.log(this.exp / 25) / Math.log(2)) + 1;
    this.rewards = rewards;
    this.gold = gold;
    this.items = items || [];
  }

  calcLevel() {
    this.level = this.exp < 25 ? 0 : Math.floor(Math.log(this.exp / 25) / Math.log(2)) + 1;
  }

  setStat(stat, value) {
    this.stats[stat] = value;
    switch (stat) {
      case 'strength':
        this.minDamage = value + this.equippedItems.reduce((acc, item) => acc + (item.stats.minDamage || 0), 0);
        this.maxDamage = value + 5 + this.equippedItems.reduce((acc, item) => acc + (item.stats.maxDamage || 0), 0);
        break;
      case 'agility':
        this.dodgeChance = value + this.equippedItems.reduce((acc, item) => acc + (item.stats.dodgeChance || 0), 0);
        break;
      case 'luck':
        this.critChance = value + this.equippedItems.reduce((acc, item) => acc + (item.stats.critChance || 0), 0);
        break;
      case 'endurance':
        this.health = value * 10 + this.equippedItems.reduce((acc, item) => acc + (item.stats.health || 0), 0);
        this.initHealth = this.health;
        break;
    }
  }
}

class Battle {
  constructor(char1, char2, battleLog='', playerPattern) {
    this.char1 = char1;
    this.char2 = char2;
    this.zones = [
      "Head",
      "Neck",
      "Body",
      "Belly",
      "Legs"
    ];
    this.critMultiplier = 2;
    this.finished = false;
    this.battleLog = battleLog;
    this.playerPattern = playerPattern || {attack: [], defense: []};
  }

  start() {
    window.localStorage.setItem('battle', JSON.stringify(this));
    document.querySelector('.log').innerHTML = this.battleLog ? this.battleLog : 'The battle begins...';
    this.initRender();
  }

  makeTurn(playerAttackZones, playerDefenceZones) {
    if (this.finished) return;
    console.log(playerAttackZones, playerDefenceZones);
    playerAttackZones.forEach(zone => this.playerPattern.attack.push(zone));
    playerDefenceZones.forEach(zone => this.playerPattern.defense.push(zone));
    console.log(this.playerPattern);
    
    const {enemyAttackZones, enemyDefenceZones} = this.generateEnemyZones();
    console.log(enemyAttackZones, enemyDefenceZones);

    const playerMakeDamage = this.calcDamage(playerAttackZones, enemyDefenceZones, this.char1, this.char2);
    const enemyMakeDamage = this.calcDamage(enemyAttackZones, playerDefenceZones, this.char2, this.char1);

    console.log(playerMakeDamage, enemyMakeDamage);
    this.char2.health -= playerMakeDamage;
    this.char1.health -= enemyMakeDamage;
    this.log();
    this.render();
    this.save();
    if (this.char1.health <= 0 && this.char2.health <= 0) {
      return this.finishBattle(null)
    } else if (this.char1.health <= 0 && this.char2.health > 0) {
      return this.finishBattle(this.char2)
    } else if (this.char2.health <= 0 && this.char1.health > 0) {
      return this.finishBattle(this.char1)
    } 
  }

  ai() {
    const attackWeights = this.playerPattern.attack.reduce((acc, zone) => {
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {});
    const defenceWeights = this.playerPattern.defense.reduce((acc, zone) => {
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {});
    console.log(attackWeights, defenceWeights);
    const attackMaxValue = getMaxValueKeys(attackWeights, this.char2.blocks > 1 ? this.char2.blocks - 1 : 1);
    const defenceMaxValue = getMaxValueKeys(defenceWeights, this.char1.blocks);
    console.log(attackMaxValue, defenceMaxValue);

    return { attackPrediction: attackMaxValue, defencePrediction: defenceMaxValue };

    function getMaxValueKeys(obj, size) {
      return Object.keys(obj).sort((a, b) => obj[a] < obj[b]).splice(0, size);
    }

  }

  calcDamage(attackZones, defenceZones, attacker, defender) {
    return attackZones.reduce((total, zone) => {
      const crit = this.calcChance(attacker.critChance);
      const damage = this.calcPunchDamage(attacker);
      const dodge = this.calcChance(defender.dodgeChance);
      if (dodge) {
        this.log(`<strong>${attacker.name}</strong> tried to hit <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> but <strong>${defender.name}</strong> dodged from it.`);
        return total;
      }
      if (!defenceZones.includes(zone)) {
        if (crit) {
          this.log(`<strong>${attacker.name}</strong> landed a critical hit on <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> and dealt <strong class="red">${damage * this.critMultiplier}</strong> damage`);
          return total + damage * this.critMultiplier;
        } else {
          this.log(`<strong>${attacker.name}</strong> attacked <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> and dealt <strong>${damage}</strong> damage`);
          return total + damage;
        }
      } else {
        if (crit) {
          this.log(`<strong>${attacker.name}</strong> attacked <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong>. ${defender.name} tried to block, but was critically hit, taking <strong class="red">${damage}</strong> damage`);
          return total + damage;
        } else {
          this.log(`<strong>${attacker.name}</strong> attacked <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> but it was blocked`);
          return total;
        }
      }
    }, 0)
  }

  finishBattle(winner) {
    this.finished = true;
    if (!winner) {
      this.char1.draws++;
      this.log(`Draw. You killed each other.`);
    }
    if (winner === this.char1) {
      this.char1.wins++;
      const exp = this.calcChance(this.char1.luck) ? this.char2.rewards.exp : Math.floor(Math.max(Math.random(), 0.2) * this.char2.rewards.exp);
      this.char1.exp += exp;
      const gold = this.calcChance(this.char1.luck) ? this.char2.rewards.gold : Math.floor(Math.max(Math.random(), 0.2) * this.char2.rewards.gold);
      this.char1.gold += gold;
      this.log(`You win the battle. Enemy defeated.`);
      this.log(`You gained ${exp} exp and ${gold} gold.`);
      this.char1.calcLevel();
    } else if (winner === this.char2) {
      this.char1.losses++;
      this.log(`Nice try but you lost the battle.`);
    }
    this.char1.health = this.char1.initHealth;
    window.localStorage.setItem('char', JSON.stringify(this.char1));
    window.localStorage.removeItem('battle');
    return true;
  }

  calcChance(critChance) {
    return Math.random() * 100 < critChance;
  }

  calcPunchDamage(attacker) {
    const baseDamage = Math.floor(Math.random() * (attacker.maxDamage - attacker.minDamage + 1)) + attacker.minDamage;
    return baseDamage;
  }

  generateEnemyZones() {
    const prediction = this.ai();
    const attackZones = this.zones.filter(zone => !prediction.defencePrediction.includes(zone));
    const defenceZones = this.zones.filter(zone => !prediction.attackPrediction.includes(zone));

    const enemyDefenceZones = getRandomElements(defenceZones, this.char2.blocks - prediction.attackPrediction.length).concat(prediction.attackPrediction);
    console.log(enemyDefenceZones);

    return {
      enemyAttackZones: getRandomElements(attackZones, this.char2.hits),
      enemyDefenceZones: enemyDefenceZones
    }

    function getRandomElements(arr, n) {
      const copy = [...arr];
      const result = [];

      const count = Math.min(n, copy.length);

      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * copy.length);
        result.push(copy[randomIndex]);
        copy.splice(randomIndex, 1);
      }

      return result;
    }
  }

  log(message) {
    const logEntry = document.createElement('p');
    if (!message) {
      logEntry.classList.add('divider');
    } else {
      logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    }
    document.querySelector('.log').prepend(logEntry);
  }

  save() {
    this.battleLog = document.querySelector('.log').innerHTML;
    window.localStorage.setItem('battle', JSON.stringify(this));
  }
  initRender() {
    document.querySelector('.player .health').dataset.health = this.char1.health;
    document.querySelector('.enemy .health').dataset.health = this.char2.health;
    document.querySelector('.player .health').dataset.init = this.char1.initHealth;
    document.querySelector('.enemy .health').dataset.init = this.char2.initHealth;
    document.querySelector('.player .name').innerText = this.char1.name;
    document.querySelector('.enemy .name').innerText = this.char2.name;
    document.querySelector('.player .avatar').src = this.char1.avatar;
    document.querySelector('.enemy .avatar').src = this.char2.avatar;
    this.renderHealth();
  }

  render() {
    this.renderHealth();
  }

  renderHealth() {
    document.querySelector('.player .health').dataset.health = this.char1.health;
    document.querySelector('.enemy .health').dataset.health = this.char2.health;

    if (this.char1.health * 100 / this.char1.initHealth <= 70) {
      document.querySelector('.player .health').style.setProperty('--color', `#ded712`);
    }
    if (this.char2.health * 100 / this.char2.initHealth <= 70) {
      document.querySelector('.enemy .health').style.setProperty('--color', `#ded712`);
    }
    if (this.char1.health * 100 / this.char1.initHealth <= 30) {
      document.querySelector('.player .health').style.setProperty('--color', `red`);
    }
    if (this.char2.health * 100 / this.char2.initHealth <= 30) {
      document.querySelector('.enemy .health').style.setProperty('--color', `red`);
    }
    document.querySelector('.player .health').style.setProperty('--health', `${this.char1.health * 100 / this.char1.initHealth}%`);
    document.querySelector('.enemy .health').style.setProperty('--health', `${this.char2.health * 100 / this.char2.initHealth}%`);
  }
  
}