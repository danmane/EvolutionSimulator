class C
  # Environment variables
  @DISPLAY_X = 1000
  @DISPLAY_Y = 500
  @X_BOUND = @DISPLAY_X + 200
  @Y_BOUND = @DISPLAY_Y + 200
  @DISPLAY_BOUND = 100

  @SMALL_SIZE  = 10
  @MEDIUM_SIZE = 30
  @LARGE_SIZE  = 60
  @HUGE_SIZE   = 200
  

  @NEIGHBOR_DISTANCE = 100
  @CHILD_DISTANCE    = 20
  @ATTACK_MARGIN     = 100
  @STARTING_ENERGY   = 200
  @STARTING_BLOBS    = 200
  
  # Blob variables
  @MOVEMENT_PER_ENERGY = 100
  @REPR_ENERGY_COST    = 300
  @MOVEMENT_SPEED_FACTOR = .02
  @PHO_EPS =  .2
  @PHO_SQ_EPS = .01
  @ATK_EPS = -2
  @ATK_SQ_EPS = -.01
  @SPD_EPS = 0.2
  @AGE_ENERGY_DECAY = .001
  @RADIUS_FACTOR = .1
  @RADIUS_CONSTANT = 2 
  @ENERGY_DECAY = .001 # not implemented
  @REPR_TIME_REQUIREMENT = 7


  # Backend variables
  @QTREE_BUCKET_SIZE = 100
  @FRAME_RATE = 30
