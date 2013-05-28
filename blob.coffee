# Rendering code adopted from Harry Brundage's flocking example,
# adopted in turn from Daniel Shiffman's flocking example, found 
# here: http://processingjs.org/learning/topic/flocking/

class Blob
  @numBlobs = 0
  constructor: (@environment, @position, @energy=0, @geneCode) -> 
    @id  = Blob.numBlobs++
    @age = 0
    @geneCode ?= new GeneCode()
    @pho = @geneCode.pho
    @atk = @geneCode.atk
    @spd = @geneCode.spd
    @eff = @geneCode.eff
    @efficiencyFactor = 1 - @eff / 100
    @energyPerSecond = @pho / 20 - (@spd + @atk) * @efficiencyFactor
    @attackPower = Math.pow(@atk, 2)
    @currentHeading = null
    
  step: (observables, attackables) ->
    """One full step of simulation for this blob.
    Observables: Everything within seeing distance. Represented as
    list of [blob, distance] pairs.
    Attackables: Everything which is adjacent and close enough to 
    auto-attack. These are passed by the environment"""
    @energy += @energyPerSecond
    @age++

    for a in attackables
      # Note: Order in which blobs are considered can change outcome
      @energy += Math.min(@attackPower, a.energy)
      a.energy -= @attackPower

    action = @chooseAction(observables)
    if action.actionType is "repr"
      @reproduce(action.argument)
    
    @calculateHeading(action)
    if @currentHeading?
      @move(@currentHeading)

    if @energy < 0
      @environment.removeBlob(this)

  calculateHeading: (action) ->
    if action.actionType is "pursuit"
      if action.argument?
        # Let's set heading as the vector pointing towards target 
        target = action.pursuitTarget
        @currentHeading = Vector2D.subtract(target.position, @position)
        @currentHeading.normalize()
      else
        # If we don't have a current heading, set it randomly
        # This way hunters move randomly but with determination when 
        # looking for prey
        # Conversely if they just lost sight of their prey they will
        # keep in the same direction
        @currentHeading ?= Vector2D.randomUnitVector()

    else if action.actionType is "flight" and action.argument?
      target = action.argument
      @currentHeading = Vector2D.subtract(@position, target.position)
      @currentHeading.normalize()
      # Current implementation only flees 1 target w/ highest fear

    else # No action -> stay put
      @currentHeading = null

  chooseAction: (observables) ->
    @geneCode.calculateAction(@energy, observables)
    

  reproduce: (childEnergy) ->
    if @energy >= childEnergy + REPR_BASE_COST
      @energy  -= childEnergy + REPR_BASE_COST
      @environment.addChildBlob(this, childEnergy)

  move: (heading) ->
    if @energy > @speed * @efficiencyFactor
      @energy -= @speed * @efficiencyFactor
      movement = Vector2D.multiply(heading, @speed)
      @position.add(movement)

  getDistance: (otherBlob) ->
    @position.eucl_distance(otherBlob.position)

