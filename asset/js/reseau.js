class reseau {
    constructor(params) {
        var me = this;
        this.cont = d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.dataUrl = params.dataUrl ? params.dataUrl : false;
        this.fontSize = params.fontSize ? params.fontSize : 12;
        this.settingsColors = params.settingsColors ? params.settingsColors : false;
        this.fctClickNode = params.fctClickNode ? params.fctClickNode : console.log;
        this.data = params.data ? params.data : 	{
            "nodes": [
                {
                "id": "Myriel",
                "group": 1
                },
                {
                "id": "Napoleon",
                "group": 1
                },
            ],
            "links": [
                {
                "source": "Napoleon",
                "target": "Myriel",
                "value": 1
                },
                {
                "source": "Mlle.Baptistine",
                "target": "Myriel",
                "value": 8
                },
            ]
        }; 

        var svg, container, link, node, labelNode, color, colors=[], label
        ,adjlist, labelLayout, graphLayout
        ,objEW, lgdSize, legende, sltGroup=[];            

        this.init = function () {
            
                color = d3.scaleOrdinal(d3.schemeCategory10);
                //récupère les couleurs des settings
                me.settingsColors.forEach(c => colors[c.class]=c.color);                
                
                lgdSize = {x: 0, y:0, width: me.width-15, height: me.fontSize*3};

                label = {
                    'nodes': [],
                    'links': []
                };
            
                me.data.nodes.forEach(function(d, i) {
                    label.nodes.push({node: d});
                    label.nodes.push({node: d});
                    label.links.push({
                        source: i * 2,
                        target: i * 2 + 1
                    });
                });
            
                labelLayout = d3.forceSimulation(label.nodes)
                    .force("charge", d3.forceManyBody().strength(-50))
                    .force("link", d3.forceLink(label.links).distance(0).strength(2));

                let heightForce = (me.height / 2);// + (lgdSize.height*2);
                graphLayout = d3.forceSimulation(me.data.nodes)
                    .force("charge", d3.forceManyBody().strength(-3000))
                    .force("center", d3.forceCenter(me.width / 2, heightForce))
                    .force("x", d3.forceX(me.width / 2).strength(1))
                    .force("y", d3.forceY(heightForce).strength(1))
                    .force("link", d3.forceLink(me.data.links).id(function(d) {return d.id; }).distance(50).strength(1))
                    .on("tick", ticked);
            
                adjlist = [];
            
                me.data.links.forEach(function(d) {
                    adjlist[d.source.index + "-" + d.target.index] = true;
                    adjlist[d.target.index + "-" + d.source.index] = true;
                });


                svg = this.cont.append("svg").attr("width", me.width+'px').attr("height", me.height+'px');
                //ajoute la légende
                legende = svg.append('g').attr('id','reseauLegende')
                legende.append('rect')
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("fill", 'black')
                    .attr("height", lgdSize.height*2)
                    .attr("width", lgdSize.width)

                //création du conteneur pour le graph
                container = svg.append("g");                
                svg.call(
                    d3.zoom()
                        .scaleExtent([.1, 4])
                        .on('zoom', (event) => {
                            container.attr('transform', event.transform);
                          })                        
                );
                
                link = container.append("g")
                    .attr("class", "links")
                    .selectAll("line")
                    .data(me.data.links)
                    .enter()
                    .append("line")
                    .attr("class", d => "l_"+d.group.replace(':','-'))
                    .attr("stroke", d => getColor(d.group))
                    .attr("stroke-width", "3px");
                
                node = container.append("g")
                    .attr("class", "nodes")
                    .selectAll("g")
                    .data(me.data.nodes)
                    .enter()
                    .append("circle")
                    .attr("class", d=>"n_"+d.group)
                    .attr("r", function(d) { 
                        return d.size ? 5*d.size : 5; 
                    })
                    .style("cursor","zoom-in")
                    .attr("fill-opacity",0.4)
                    .attr("fill", d => getColor(d.group));
                
                node.on("mouseover", focus)
                    .on("mouseout", unfocus)
                    .on("click", me.fctClickNode);
                
                node.call(
                    d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                );
                
                labelNode = container.append("g").attr("class", "labelNodes")
                    .selectAll("text")
                    .data(label.nodes)
                    .enter()
                    .append("text")
                    .attr("class", d=>"t_"+d.node.group)
                    .text(function(d, i) { 
                        let txt = d.node.title ? d.node.title : d.node.id;
                        return i % 2 == 0 ? "" : txt; 
                    })
                    .style("fill", "white")
                    .style("font-family", "Arial")
                    .style("font-size", me.fontSize)
                    .style("pointer-events", "none"); // to prevent mouseover/drag capture
                
                node.on("mouseover", focus).on("mouseout", unfocus);


            //ajoute la légende
            addLegende('noeuds', me.data.nodes,{y:0});
            addLegende('liens', me.data.links,{y:lgdSize.height/2});
         
                           
        }

        function getColor(key){
            let c = "#aaa";            
            if(key){
                c = colors[key] ? colors[key] : color(key); 
            }
            return c;
        }

        function addLegende(nom, data,ori){
            let types = Array.from(d3.group(data, d => d.group).keys());

            types.unshift(nom+' : ');              
            let scaleLgdHori = d3
              .scaleBand()
              //.paddingInner(0.2)
              .domain(types)
              .range([lgdSize.x, lgdSize.width]);            
            let itemsLgd = legende.selectAll('.ilgd'+nom).data(types).enter()
                .append('g').attr('class','ilgd'+nom)
                .style("cursor","pointer")
                .on('click',selectGroup);
            itemsLgd.append('rect')         
              .attr("x", d => scaleLgdHori(d))
              .attr("y", ori.y+lgdSize.height/4)
              .attr("fill", (d,i) => i==0 ? 'black' : getColor(d))
              .attr("height", lgdSize.height/2)
              .attr("width", scaleLgdHori.bandwidth());
            itemsLgd.append('text')         
              .attr("x", (d,i) => i==0 ? scaleLgdHori(d) : scaleLgdHori(d)+scaleLgdHori.bandwidth()/2)
              .attr("y", ori.y+lgdSize.height/2 + me.fontSize/2)
              .attr("text-anchor", (d,i) => i==0 ? "start" : "middle")
              .attr("font-size", me.fontSize)
              .style("fill", "white")
              .text(d => d);
        }

        function selectGroup(e,d){
            if(!sltGroup[d])sltGroup[d]='hidden';
            else
                sltGroup[d]=sltGroup[d]=='hidden' ? 'visible' : 'hidden';
            //on change le bouton
            d3.select(e.target.parentNode.firstChild).attr('fill', sltGroup[d]=='hidden' ? 'black' : color(d));
            //on cache les noeuds, liens et textes
            d3.selectAll('.n_'+d.replace(':','-')).attr('visibility',sltGroup[d]).each(showHideNodeLine);
            d3.selectAll('.l_'+d.replace(':','-')).attr('visibility',sltGroup[d]);
            d3.selectAll('.t_'+d.replace(':','-')).attr('visibility',sltGroup[d]);
        }
        function showHideNodeLine(d){
            link.attr("visibility", o => o.source.index == d.index || o.target.index == d.index ? 'visible' : sltGroup[d.group]);
        }


        this.hide = function(){
          svg.attr('visibility',"hidden");
        }
        this.show = function(){
          svg.attr('visibility',"visible");
        }

        function fctExecute(p) {
            switch (p.data.fct) {
                case 'showRoueEmotions':
                  me.hide();
                  if(!objEW)
                    objEW = new emotionswheel({'idCont':me.cont.attr('id'),'width':me.width,'height':me.width});
                  else
                    objEW.show();
                  break;
                default:
                  console.log(p);
            }            
        }

        function neigh(a, b) {
            return a == b || adjlist[a + "-" + b];
        }
        
        function ticked() {
        
            node.call(updateNode);
            link.call(updateLink);
        
            //labelLayout.alphaTarget(0.3).restart();
            labelNode.each(function(d, i) {
                if(i % 2 == 0) {
                    d.x = d.node.x;
                    d.y = d.node.y;
                } else {
                    var b = this.getBBox();
        
                    var diffX = d.x - d.node.x;
                    var diffY = d.y - d.node.y;
        
                    var dist = Math.sqrt(diffX * diffX + diffY * diffY);
        
                    var shiftX = b.width * (diffX - dist) / (dist * 2);
                    shiftX = Math.max(-b.width, Math.min(0, shiftX));
                    var shiftY = 16;
                    this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
                }
            });
            labelNode.call(updateNode);
        
        }
        
        function fixna(x) {
            if (isFinite(x)) return x;
            return 0;
        }
        
        function focus(event, d) {
            var index = d.index;
            node.style("opacity", function(o) {
                return neigh(index, o.index) ? 1 : 0.1;
            });
            labelNode.attr("display", function(o) {
                return neigh(index, o.node.index) ? "block": "none";
            });
            link.style("opacity", function(o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });
        }
        
        function unfocus() {
            labelNode.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", 1);
        }
        
        function updateLink(link) {
            link.attr("x1", function(d) { return fixna(d.source.x); })
                .attr("y1", function(d) { return fixna(d.source.y); })
                .attr("x2", function(d) { return fixna(d.target.x); })
                .attr("y2", function(d) { return fixna(d.target.y); });
        }
        
        function updateNode(node) {
            node.attr("transform", function(d) {
                return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
            });
        }
        
        function dragstarted(e, d) {
            e.sourceEvent.stopPropagation();
            if (!e.active) graphLayout.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(e, d) {
            d.fx = e.x;
            d.fy = e.y;
        }
        
        function dragended(e, d) {
            if (!e.active) graphLayout.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }              

        if(me.dataUrl){
            d3.json(me.dataUrl).then(function(graph) {
                me.data = graph;
                me.init();
            });    
        }else{
            me.init();
        }

    }
}

  


