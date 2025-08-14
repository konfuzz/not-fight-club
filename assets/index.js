class Char {
  constructor({name, health=100, damage=10, critChance=50, hits=1, blocks=2, wins=0, loses=0, draws=0}) {
    this.name = name;
    this.initHealth = health;
    this.health = health;
    this.damage = damage;
    this.critChance = critChance;
    this.hits = hits;
    this.blocks = blocks;
    this.wins = wins;
    this.loses = loses;
    this.draws = draws;
  }
}

class Battle {
  constructor(char1, char2, battleLog='') {
    this.player = char1;
    this.char1 = {...char1};
    this.char2 = {...char2};
    this.zones = [
      "Head",
      "Neck",
      "Body",
      "Belly",
      "Legs"
    ];
    this.critMultiplier = 1.5;
    this.finished = false;
    this.battleLog = battleLog;
  }

  start() {
    window.localStorage.setItem('battle', JSON.stringify(this));
    document.querySelector('.log').innerHTML = this.battleLog;
  }

  makeTurn(playerAttackZones, playerDefenceZones, log = this.log) {
    if (this.finished) return;
    const {enemyAttackZones, enemyDefenceZones} = this.generateEnemyZones();

    const playerMakeDamage = calcDamage(playerAttackZones, enemyDefenceZones, this.char1, this.char2, this.critMultiplier);
    const enemyMakeDamage = calcDamage(enemyAttackZones, playerDefenceZones, this.char2, this.char1, this.critMultiplier);

    function calcDamage(attackZones, defenceZones, attacker, defender, critMultiplier) {
      return attackZones.reduce((total, zone) => {
        const crit = calcCritChance(attacker.critChance);
        if (!defenceZones.includes(zone)) {
          if (crit) {
            log(`<strong>${attacker.name}</strong> landed a critical hit on <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> and dealt <strong class="red">${attacker.damage * critMultiplier}</strong> damage`);
            return total + attacker.damage * critMultiplier;
          }
          log(`<strong>${attacker.name}</strong> attacked <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> and dealt <strong>${attacker.damage}</strong> damage`);
          return total + attacker.damage;
        }
        if (crit) {
          log(`<strong>${attacker.name}</strong> attacked <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong>. It was blocked, but a critical hit would have dealt <strong class="red">${attacker.damage}</strong> damage`);
          return total + attacker.damage;
        } else {
          log(`<strong>${attacker.name}</strong> attacked <strong>${defender.name}</strong>'s <strong>${zone.toLowerCase()}</strong> but it was blocked`);
          return total;
        }
        
      }, 0)
    }

    function calcCritChance(critChance) {
      return Math.random() * 100 < critChance;
    }

    console.log(playerMakeDamage, enemyMakeDamage);
    this.char2.health -= playerMakeDamage;
    this.char1.health -= enemyMakeDamage;
    log();
    this.save();
    if (this.char1.health <= 0 && this.char2.health <= 0) {
      this.finishBattle()
      log(`Draw. You killed each other.`);
    } else if (this.char1.health <= 0 && this.char2.health > 0) {
      this.finishBattle(this.char2)
      log(`Nice try but you lost the battle.`);
    } else if (this.char2.health <= 0 && this.char1.health > 0) {
      this.finishBattle(this.char1)
      log(`You win the battle. Enemy defeated.`);
    } 
    console.log(this)
  }

  generateEnemyZones() {
    return {
      enemyAttackZones: getRandomElements(this.zones, this.char2.hits),
      enemyDefenceZones: getRandomElements(this.zones, this.char2.blocks)
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

  finishBattle(winner) {
    this.finished = true;
    if (!winner) {
      this.player.draws++;
      return;
    }
    if (winner === this.char1) {
      this.player.wins++;
    } else {
      this.player.loses++;
    }
    this.player.health = this.player.initHealth;
    window.localStorage.setItem('char', JSON.stringify(this.player));
    window.localStorage.removeItem('battle');
  }

  save() {
    this.battleLog = document.querySelector('.log').innerHTML;
    window.localStorage.setItem('battle', JSON.stringify(this));
  }
  
}