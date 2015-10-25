// Generated by CoffeeScript 1.10.0
(function() {
  var Frontend, Renderer, WAIT_FACTOR;

  WAIT_FACTOR = 1.1;

  Renderer = (function() {
    function Renderer(frontend1, p1) {
      this.frontend = frontend1;
      this.p = p1;
      this.frames = 0;
      this.frameRate = this.frontend.C.FRAME_RATE;
      this.framesUntilUpdate = 1;
      this.colors = {};
      this.futureColors = {};
      this.currentState = {};
      this.futureState = {};
      this.delta = {};
      this.updateAvailable = false;
      this.update = [];
      this.thunks = 0;
      this.requestUpdate();
      this.lastFrame = Date.now();
      this.removedLastStep = [];
    }

    Renderer.prototype.step = function() {
      var currentTime;
      this.frames++;
      currentTime = Date.now();
      this.lastFrame = currentTime;
      if (this.framesUntilUpdate === 0) {
        if (this.updateAvailable) {
          if (this.thunks > 0) {
            WAIT_FACTOR += .05;
            WAIT_FACTOR *= 1.05;
            console.log("Thunked " + this.thunks + " times");
            this.thunks = 0;
          }
          this.processUpdate();
        } else {
          this.thunks++;
        }
      }
      if (!this.thunks) {
        return this.drawAll();
      }
    };

    Renderer.prototype.drawBlob = function(state, color) {
      var blu, grn, r, red, x, y;
      x = state[0], y = state[1], r = state[2];
      red = color[0], grn = color[1], blu = color[2];
      this.p.noStroke();
      this.p.fill(red, grn, blu);
      return this.p.ellipse(x, y, 2 * r, 2 * r);
    };

    Renderer.prototype.drawAll = function() {
      var id, ref, state;
      this.p.background(0, 40, 0);
      ref = this.currentState;
      for (id in ref) {
        state = ref[id];
        state[0] += this.delta[id][0];
        state[1] += this.delta[id][1];
        state[2] += this.delta[id][2];
        this.drawBlob(state, this.colors[id]);
      }
      return --this.framesUntilUpdate;
    };

    Renderer.prototype.requestUpdate = function() {
      this.requestTime = Date.now();
      return this.frontend.requestUpdate();
    };

    Renderer.prototype.receiveUpdate = function(update) {
      this.update = update;
      this.timeElapsed = Date.now() - this.requestTime;
      return this.updateAvailable = true;
    };

    Renderer.prototype.processUpdate = function() {
      var addedBlobs, c, dr, dx, dy, i, id, j, len, len1, rc, ref, ref1, ref2, ref3, removedBlobs, rf, xc, xf, yc, yf;
      this.updateAvailable = false;
      this.requestUpdate();
      this.currentState = this.futureState;
      this.futureState = this.update.blobs;
      removedBlobs = this.update.removed;
      addedBlobs = this.update.added;
      for (id in addedBlobs) {
        c = addedBlobs[id];
        this.colors[id] = c;
      }
      ref = this.removedLastStep;
      for (i = 0, len = ref.length; i < len; i++) {
        id = ref[i];
        delete this.colors[id];
      }
      this.framesUntilUpdate = Math.ceil(WAIT_FACTOR * this.timeElapsed / this.frameRate);
      if (this.framesUntilUpdate < 4) {
        this.framesUntilUpdate = 4;
      }
      ref1 = this.futureState;
      for (id in ref1) {
        ref2 = ref1[id], xf = ref2[0], yf = ref2[1], rf = ref2[2];
        if (!(id in this.currentState)) {
          this.currentState[id] = [xf, yf, 0];
        }
        ref3 = this.currentState[id], xc = ref3[0], yc = ref3[1], rc = ref3[2];
        dx = (xf - xc) / this.framesUntilUpdate;
        dy = (yf - yc) / this.framesUntilUpdate;
        dr = (rf - rc) / this.framesUntilUpdate;
        this.delta[id] = [dx, dy, dr];
      }
      for (j = 0, len1 = removedBlobs.length; j < len1; j++) {
        id = removedBlobs[j];
        if (id in this.currentState) {
          dr = -this.currentState[id][2] / this.framesUntilUpdate;
          this.delta[id] = [0, 0, dr];
        } else {
          console.log("blob " + id + " was listed as removed but not found in state");
        }
      }
      return this.removedLastStep = removedBlobs;
    };

    return Renderer;

  })();

  Frontend = (function() {
    function Frontend(p1, guiSettings1, nonGuiSettings1) {
      var d, k, ref, ref1, v;
      this.p = p1;
      this.guiSettings = guiSettings1;
      this.nonGuiSettings = nonGuiSettings1;
      this.running = true;
      if (!window.simulationWorker) {
        throw new Error("Please define a simulation worker path (eg dist/simulation.js)");
      }
      this.sim = new Worker(window.simulationWorker);
      this.sim.onmessage = (function(_this) {
        return function(event) {
          switch (event.data.type) {
            case 'blobs':
              return _this.renderer.receiveUpdate(event.data);
            case 'debug':
              return console.log(event.data.msg);
          }
        };
      })(this);
      this.C = {};
      ref = this.nonGuiSettings;
      for (k in ref) {
        v = ref[k];
        this.C[k] = v;
      }
      ref1 = this.guiSettings;
      for (k in ref1) {
        d = ref1[k];
        this.C[k] = d.value;
      }
      this.C.X_BOUND = $(window).width();
      this.C.Y_BOUND = $(window).height();
      this.updateConstants();
      this.setupGui();
      this.addBlobs(this.C.STARTING_BLOBS);
      this.renderer = new Renderer(this, this.p);
      this.running = true;
      $(window).resize((function(_this) {
        return function() {
          console.log("Resizing");
          _this.C.X_BOUND = $(window).width();
          _this.C.Y_BOUND = $(window).height();
          _this.p.size(_this.C.X_BOUND, _this.C.Y_BOUND);
          return _this.updateConstants();
        };
      })(this));
    }

    Frontend.prototype.updateConstants = function() {
      console.log("Called update constants");
      return this.sim.postMessage({
        type: 'updateConstants',
        data: this.C
      });
    };

    Frontend.prototype.setupGui = function() {
      var container, gui, opt, ref, vals, varName;
      opt = {};
      opt['Kill all blobs'] = (function(_this) {
        return function() {
          return _this.sim.postMessage({
            type: 'killAllBlobs'
          });
        };
      })(this);
      opt['Kill most blobs'] = (function(_this) {
        return function() {
          return _this.sim.postMessage({
            type: 'killMostBlobs'
          });
        };
      })(this);
      opt['Add 50 blobs'] = (function(_this) {
        return function() {
          return _this.sim.postMessage({
            type: 'addBlobs',
            data: 50
          });
        };
      })(this);
      opt['Randomize environment'] = (function(_this) {
        return function() {
          var max, min, ref, valueDict, varName;
          ref = _this.guiSettings;
          for (varName in ref) {
            valueDict = ref[varName];
            min = valueDict.minValue;
            max = valueDict.maxValue;
            _this.C[varName] = min + Math.random() * (max - min);
            if (valueDict.valueType === "Integer") {
              _this.C[varName] = Math.round(_this.C[varName]);
            }
          }
          return _this.updateConstants();
        };
      })(this);
      opt['Shift environment'] = (function(_this) {
        return function() {
          var max, min, movement, ref, valueDict, varName;
          ref = _this.guiSettings;
          for (varName in ref) {
            valueDict = ref[varName];
            min = valueDict.minValue;
            max = valueDict.maxValue;
            movement = (max - min) * .05 * (Math.random() * 2 - 1);
            _this.C[varName] += movement;
            if (_this.C[varName] < min) {
              _this.C[varName] = min;
            }
            if (_this.C[varName] > max) {
              _this.C[varName] = max;
            }
            if (valueDict.valueType === "Integer") {
              _this.C[varName] = Math.round(_this.C[varName]);
            }
          }
          return _this.updateConstants();
        };
      })(this);
      container = document.getElementById("gui-container");
      if (container == null) {
        throw new Error("Please create #gui-container for the gui");
      }
      gui = new dat.GUI({
        autoplace: false
      });
      container.appendChild(gui.domElement);
      ref = this.guiSettings;
      for (varName in ref) {
        vals = ref[varName];
        if (vals.valueType === "Number") {
          gui.add(this.C, varName).min(vals.minValue).max(vals.maxValue).listen().onFinishChange((function(_this) {
            return function() {
              return _this.updateConstants();
            };
          })(this));
        }
        if (vals.valueType === "Integer") {
          gui.add(this.C, varName).min(vals.minValue).max(vals.maxValue).step(1).listen().onFinishChange((function(_this) {
            return function() {
              return _this.updateConstants();
            };
          })(this));
        }
      }
      gui.add(opt, 'Kill all blobs');
      gui.add(opt, 'Add 50 blobs');
      gui.add(opt, 'Kill most blobs');
      gui.add(opt, 'Randomize environment');
      gui.add(opt, 'Shift environment');
      this.showNucleus = false;
      this.showShells = false;
      return this.showReproduction = false;
    };

    Frontend.prototype.step = function() {
      if (this.running) {
        return this.renderer.step();
      }
    };

    Frontend.prototype.requestUpdate = function() {
      return this.sim.postMessage({
        type: 'go'
      });
    };

    Frontend.prototype.addBlobs = function(n) {
      return this.sim.postMessage({
        type: 'addBlobs',
        data: n
      });
    };

    Frontend.prototype.keyCode = function(k) {
      if (k === 32) {
        this.running = !this.running;
      }
      if (k === 78) {
        this.showNucleus = !this.showNucleus;
      }
      if (k === 83) {
        this.showShells = !this.showShells;
      }
      if (k === 82) {
        return this.showReproduction = !this.showReproduction;
      }
    };

    return Frontend;

  })();

  window.activateEvolutionSimulator = function(canvas, guiSettings, nonGuiSettings) {
    var processing, processingSetup;
    processingSetup = function(p) {
      var frontend;
      frontend = new Frontend(p, guiSettings, nonGuiSettings);
      p.mouseClicked = function() {
        return frontend.mouseClick(p.mouseX, p.mouseY);
      };
      p.setup = function() {
        p.frameRate(frontend.C.FRAME_RATE);
        p.size(frontend.C.X_BOUND, frontend.C.Y_BOUND);
        return p.background(0, 20, 90);
      };
      p.draw = function() {
        return frontend.step();
      };
      return p.keyPressed = function() {
        console.log(p.keyCode);
        return frontend.keyCode(p.keyCode);
      };
    };
    return processing = new Processing(canvas, processingSetup);
  };

}).call(this);
