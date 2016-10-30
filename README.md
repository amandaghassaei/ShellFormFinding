# ShellFormFinding

This design tool simulates and visualizes the behavior of preloaded thin-shell structures under pure tension.  Traditionally, shell form finding was achieved by [creating physical models](http://www.fabwiki.fabric-formedconcrete.com/lib/exe/fetch.php?media=nottingham:form-finding_and_fabric_forming_in_the_work_of_heinz_isler.pdf) from cloth and string, loading them with hanging weights or other forces, and carefully measuring their geometry at equilibrium.  Now, anyone can run form finding simulations from their laptop and design these forms virtually.

###A bit about the simulation:

This tool implements both static and dynamic simulation methods to solve for shell geometry.  The static simulation uses the [force-density method](http://www.sciencedirect.com/science/article/pii/0045782574900450) to solve a linear system of equations for the steady-state equilibrium positions of every node in the system given a force density (force per unit length) at each edge.  The static solution is indicated by a dotted line.  Adjust the visibility of the static vs dynamic simulation with the checkboxes in the upper right.

The dynamic simulation uses a [mass-spring-damper](https://graphics.stanford.edu/~mdfisher/cloth.html) system to model interactions between nodes through edges.  The nominal length of the springs connecting nodes in the system is assumed to be zero.  Damping values may range from 1% to 100% of critical damping for each node-node interaction (adjust this value with the "Damping" slider).  Calculations of the dynamic simulation are executed in parallel in a GPU fragment shader for increased performance.  After time-dependant effects have damped out, the steady-state solution of the dynamic simulation should equal the static solution for every scenario.<br/>

###Instructions:

By adjusting the topology and material properties of the structure, it is possible to achieve many diverse forms.  By default, the geometric shape of the mesh is indicated in black, and its topology, external forces, and materials are indicated in the "schematic view" underneath.<br/>

..*Click and drag to rotate the view, scroll to zoom, left click and drag to pan.
..*Adjust the dimensions of the shell with the "Width" and "Length" sliders on the left.
..*Subdivide the mesh by mousing over the white plane in the schematic view and clicking.
..*Fixed nodes are pinned to the ground, indicated with a black box.  Use the "Add/Remove Fixed Constraint" button and select a node in the schematic view to toggle its fixed state.  Click and drag a fixed node to change its height.  Double click on a fixed node to type in a height for it.
..*Change the material properties of the mesh by dragging the slider next to "Material 1".  Create new materials and assign them to edges of the mesh by selecting a new material type and clicking on edges in the schematic view.
..*The force on each node is indicated by a grey arrow.  Drag on force vectors to change the applied force at each node.  Double click on a force vector to type in a value for it.
..*By default, the structure is loaded under its own weight, turn off effects due to self weight using the "Apply Self-Weight" toggle or change the density (measured in kg/m) of the edges of the structure with the "Density" slider.
..*Download a text file containing all geometric and material properties of your design by clicking "Download Design Info".
..*Export an stl for 3D printing or other manufacturing processes.

Built by [Amanda Ghassaei](http://www.amandaghassaei.com/) as a homework assignment for [Computational Structural Design and Optimization](https://architecture.mit.edu/subject/fall-2016-4450).