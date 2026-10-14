# Adapter hosted lint repair1

Run38647338857/37daf6b typecheck and15canonicalprotocoltests passed; Verify failed11ESLintunsafe-any findings after Array.isArray narrowed a typedreadonlyarray toany[]. Root wrapped onlythatcheck in explicitlyboolean-returning isArrayValue, retaining runtimeArray.isArray semantics without typepredicatewidening. Added non-array runtime negatives. Appliedexacthostedformatterpatch toadaptertest only via gitapply(checkthenapply). No guards/assertions weakened, no nativebehavior changed. No local appchecks; independentexactdiffreview andfullhostedrerun required.
