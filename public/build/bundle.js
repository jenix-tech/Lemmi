
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Footer.svelte generated by Svelte v3.16.7 */

    const file = "src/Footer.svelte";

    function create_fragment(ctx) {
    	let footer;
    	let div4;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let div3;
    	let div1;
    	let t4;
    	let a0;
    	let t6;
    	let a1;
    	let t8;
    	let div2;
    	let t9;
    	let a2;
    	let t11;
    	let a3;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div4 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "© LemmiChat 2020";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "In loving memory of N. Lemmikki Hyry";
    			t3 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t4 = text("Icons made by\n        ");
    			a0 = element("a");
    			a0.textContent = "Freepik";
    			t6 = text("\n        from\n        ");
    			a1 = element("a");
    			a1.textContent = "www.flaticon.com";
    			t8 = space();
    			div2 = element("div");
    			t9 = text("Icons made by\n        ");
    			a2 = element("a");
    			a2.textContent = "Those Icons";
    			t11 = text("\n        from\n        ");
    			a3 = element("a");
    			a3.textContent = "www.flaticon.com";
    			add_location(p0, file, 45, 6, 678);
    			attr_dev(div0, "class", "copywrite svelte-1k4ri22");
    			add_location(div0, file, 44, 4, 648);
    			attr_dev(p1, "class", "memorial svelte-1k4ri22");
    			add_location(p1, file, 47, 4, 722);
    			attr_dev(a0, "href", "https://www.flaticon.com/authors/freepik");
    			attr_dev(a0, "title", "Freepik");
    			add_location(a0, file, 51, 8, 875);
    			attr_dev(a1, "href", "https://www.flaticon.com/");
    			attr_dev(a1, "title", "Flaticon");
    			add_location(a1, file, 55, 8, 995);
    			attr_dev(div1, "class", "credits svelte-1k4ri22");
    			add_location(div1, file, 49, 6, 823);
    			attr_dev(a2, "href", "https://www.flaticon.com/authors/those-icons");
    			attr_dev(a2, "title", "Those Icons");
    			add_location(a2, file, 61, 8, 1160);
    			attr_dev(a3, "href", "https://www.flaticon.com/");
    			attr_dev(a3, "title", "Flaticon");
    			add_location(a3, file, 67, 8, 1312);
    			attr_dev(div2, "class", "credits svelte-1k4ri22");
    			add_location(div2, file, 59, 6, 1108);
    			attr_dev(div3, "class", "credits-wrapper svelte-1k4ri22");
    			add_location(div3, file, 48, 4, 787);
    			attr_dev(div4, "class", "footer-content svelte-1k4ri22");
    			add_location(div4, file, 43, 2, 615);
    			attr_dev(footer, "class", "svelte-1k4ri22");
    			add_location(footer, file, 42, 0, 604);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div4);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(div4, t1);
    			append_dev(div4, p1);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t4);
    			append_dev(div1, a0);
    			append_dev(div1, t6);
    			append_dev(div1, a1);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, t9);
    			append_dev(div2, a2);
    			append_dev(div2, t11);
    			append_dev(div2, a3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Header.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/Header.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div = element("div");
    			p = element("p");
    			p.textContent = "Lemmi";
    			attr_dev(p, "class", "nav-title svelte-edn9g9");
    			add_location(p, file$1, 22, 4, 322);
    			attr_dev(div, "class", "nav-wrapper svelte-edn9g9");
    			add_location(div, file$1, 21, 2, 292);
    			attr_dev(nav, "class", "svelte-edn9g9");
    			add_location(nav, file$1, 20, 0, 284);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div);
    			append_dev(div, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Feature.svelte generated by Svelte v3.16.7 */

    const file$2 = "src/Feature.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1;
    	let t2;
    	let p1;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(/*description*/ ctx[2]);
    			attr_dev(img, "class", "feature-image svelte-gvbdfs");
    			if (img.src !== (img_src_value = "images/" + /*image*/ ctx[0] + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*title*/ ctx[1] + " image"));
    			add_location(img, file$2, 40, 2, 585);
    			attr_dev(p0, "class", "feature-title svelte-gvbdfs");
    			add_location(p0, file$2, 42, 4, 693);
    			attr_dev(p1, "class", "feature-description svelte-gvbdfs");
    			add_location(p1, file$2, 43, 4, 734);
    			attr_dev(div0, "class", "text-wrapper svelte-gvbdfs");
    			add_location(div0, file$2, 41, 2, 662);
    			attr_dev(div1, "class", "feature svelte-gvbdfs");
    			toggle_class(div1, "right", /*index*/ ctx[3] % 2 !== 0);
    			add_location(div1, file$2, 39, 0, 531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 1 && img.src !== (img_src_value = "images/" + /*image*/ ctx[0] + ".png")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 2 && img_alt_value !== (img_alt_value = "" + (/*title*/ ctx[1] + " image"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (dirty & /*description*/ 4) set_data_dev(t3, /*description*/ ctx[2]);

    			if (dirty & /*index*/ 8) {
    				toggle_class(div1, "right", /*index*/ ctx[3] % 2 !== 0);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { image } = $$props;
    	let { title } = $$props;
    	let { description } = $$props;
    	let { index } = $$props;
    	const writable_props = ["image", "title", "description", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Feature> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    	};

    	$$self.$capture_state = () => {
    		return { image, title, description, index };
    	};

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    	};

    	return [image, title, description, index];
    }

    class Feature extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment$2, safe_not_equal, {
    			image: 0,
    			title: 1,
    			description: 2,
    			index: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feature",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console.warn("<Feature> was created without expected prop 'image'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<Feature> was created without expected prop 'title'");
    		}

    		if (/*description*/ ctx[2] === undefined && !("description" in props)) {
    			console.warn("<Feature> was created without expected prop 'description'");
    		}

    		if (/*index*/ ctx[3] === undefined && !("index" in props)) {
    			console.warn("<Feature> was created without expected prop 'index'");
    		}
    	}

    	get image() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const hero = {
      title: "LEMMI",
      subtitle: "The app that lets you chat!",
      description: "Lemmi helps those who struggle with speech communicate, with ease, in their own words.",
    };

    const features = [
      {
        title: "Mobile",
        description: "Lemmi works on iOS and Android devices, with or without a network connection, so you can use it wherever you are."
      },
      {
        title: "Simple",
        description: "Clear text and easy navigation make communication a breeze."
      },
      {
        title: "Personal",
        description: "With Lemmi, you can add your own words, phrases and photo's so you can continue to communicate how you want to."
      },
      {
        title: "Customisable",
        description: "Select a voice, language, and colour scheme to better suit you. iOS users can add additional voices via the device's accessibility settings."
      },
      {
        title: "Intuitive",
        description: "With an intuitive text-prediction algorithm, you have quick access to your most commonly used words allowing for faster communication."
      }
    ];

    const actions = {
      contact: {
        heading: "Have a question?",
        link: "Get in touch"
      },
      waitlist: {
        heading: "Join the Waitlist",
        subheading: "Be the first to know when Lemmi is released.",
        button: "Submit",
        success: "Success! We'll email you again when Lemmi prepares to launch.",
        error: "We were unable to sign you up. Please check your email and try again. If you continue to have difficulties, please get in touch."
      }
    };

    /* src/Actions.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/Actions.svelte";

    // (111:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let input;
    	let t0;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = `${/*waitlist*/ ctx[4].button}`;
    			attr_dev(input, "id", "wait-list");
    			attr_dev(input, "class", "wait-list svelte-3v5fe8");
    			attr_dev(input, "name", "wait-list");
    			attr_dev(input, "type", "email");
    			add_location(input, file$3, 112, 8, 2296);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "class", "submit svelte-3v5fe8");
    			add_location(button, file$3, 118, 8, 2446);
    			attr_dev(div, "class", "sign-up svelte-3v5fe8");
    			add_location(div, file$3, 111, 6, 2266);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    				listen_dev(button, "click", /*handleSubmit*/ ctx[5], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*email*/ ctx[0]);
    			append_dev(div, t0);
    			append_dev(div, button);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*email*/ 1 && input.value !== /*email*/ ctx[0]) {
    				set_input_value(input, /*email*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(111:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (109:4) {#if waitlistMsg}
    function create_if_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*waitlistMsg*/ ctx[2]);
    			attr_dev(p, "class", "message svelte-3v5fe8");
    			toggle_class(p, "success", /*waitlistSuccess*/ ctx[1]);
    			add_location(p, file$3, 109, 6, 2179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*waitlistMsg*/ 4) set_data_dev(t, /*waitlistMsg*/ ctx[2]);

    			if (dirty & /*waitlistSuccess*/ 2) {
    				toggle_class(p, "success", /*waitlistSuccess*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(109:4) {#if waitlistMsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t2;
    	let a;
    	let t4;
    	let div2;
    	let p1;
    	let t6;

    	function select_block_type(ctx, dirty) {
    		if (/*waitlistMsg*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = `${/*contact*/ ctx[3].heading}`;
    			t1 = space();
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			a = element("a");
    			a.textContent = `${/*contact*/ ctx[3].link}`;
    			t4 = space();
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = `${/*waitlist*/ ctx[4].heading}`;
    			t6 = space();
    			if_block.c();
    			attr_dev(p0, "class", "heading svelte-3v5fe8");
    			add_location(p0, file$3, 96, 4, 1774);
    			attr_dev(img, "class", "contact-img svelte-3v5fe8");
    			if (img.src !== (img_src_value = "images/mail.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "contact icon");
    			add_location(img, file$3, 98, 6, 1847);
    			attr_dev(a, "class", "email svelte-3v5fe8");
    			attr_dev(a, "href", "mailto:lemmichat@gmail.com?subject=Contact from Website");
    			add_location(a, file$3, 99, 6, 1922);
    			attr_dev(div0, "class", "contact svelte-3v5fe8");
    			add_location(div0, file$3, 97, 4, 1819);
    			attr_dev(div1, "class", "contact-wrapper svelte-3v5fe8");
    			add_location(div1, file$3, 95, 2, 1740);
    			attr_dev(p1, "class", "heading svelte-3v5fe8");
    			add_location(p1, file$3, 107, 4, 2109);
    			attr_dev(div2, "class", "sign-up-wrapper svelte-3v5fe8");
    			add_location(div2, file$3, 106, 2, 2075);
    			attr_dev(div3, "class", "actions-wrapper svelte-3v5fe8");
    			add_location(div3, file$3, 94, 0, 1708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t2);
    			append_dev(div0, a);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, p1);
    			append_dev(div2, t6);
    			if_block.m(div2, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const { contact, waitlist } = actions;
    	let email;
    	let successMsg = waitlist.success;
    	let errorMsg;
    	let waitlistSuccess = false;
    	let waitlistMsg;

    	async function handleSubmit() {
    		const url = "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-waitlist";

    		const res = await fetch(url, {
    			method: "POST",
    			body: JSON.stringify({ email })
    		});

    		const response = await res.json();

    		if (response.statusCode && response.statusCode === 200) {
    			$$invalidate(1, waitlistSuccess = true);
    			$$invalidate(2, waitlistMsg = successMsg);
    		} else {
    			$$invalidate(1, waitlistSuccess = false);
    			$$invalidate(2, waitlistMsg = errorMsg);
    		}
    	}

    	function input_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("successMsg" in $$props) successMsg = $$props.successMsg;
    		if ("errorMsg" in $$props) errorMsg = $$props.errorMsg;
    		if ("waitlistSuccess" in $$props) $$invalidate(1, waitlistSuccess = $$props.waitlistSuccess);
    		if ("waitlistMsg" in $$props) $$invalidate(2, waitlistMsg = $$props.waitlistMsg);
    	};

    	return [
    		email,
    		waitlistSuccess,
    		waitlistMsg,
    		contact,
    		waitlist,
    		handleSubmit,
    		successMsg,
    		errorMsg,
    		input_input_handler
    	];
    }

    class Actions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Actions",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].title;
    	child_ctx[1] = list[i].description;
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (115:4) {#each features as { title, description }
    function create_each_block(ctx) {
    	let current;

    	const feature = new Feature({
    			props: {
    				image: /*title*/ ctx[0].toLowerCase(),
    				title: /*title*/ ctx[0],
    				description: /*description*/ ctx[1],
    				index: /*index*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(feature.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(feature, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(feature.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(feature.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(feature, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(115:4) {#each features as { title, description }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t8;
    	let img2;
    	let img2_src_value;
    	let t9;
    	let div3;
    	let t10;
    	let t11;
    	let current;
    	const header = new Header({ $$inline: true });
    	let each_value = features;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const actions = new Actions({ $$inline: true });
    	const footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `${hero.title}`;
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = `${hero.subtitle}`;
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = `${hero.description}`;
    			t7 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t8 = space();
    			img2 = element("img");
    			t9 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			create_component(actions.$$.fragment);
    			t11 = space();
    			create_component(footer.$$.fragment);
    			if (img0.src !== (img0_src_value = "images/appIcon.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lemmi Logo");
    			attr_dev(img0, "class", "svelte-2uso4e");
    			add_location(img0, file$4, 96, 6, 1557);
    			attr_dev(div0, "class", "logo svelte-2uso4e");
    			add_location(div0, file$4, 95, 4, 1532);
    			attr_dev(p0, "class", "title svelte-2uso4e");
    			add_location(p0, file$4, 98, 4, 1622);
    			attr_dev(p1, "class", "subtitle svelte-2uso4e");
    			add_location(p1, file$4, 99, 4, 1660);
    			attr_dev(p2, "class", "description svelte-2uso4e");
    			add_location(p2, file$4, 100, 4, 1704);
    			attr_dev(img1, "class", "app-icon svelte-2uso4e");
    			if (img1.src !== (img1_src_value = "images/appStore.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Download on App Store");
    			add_location(img1, file$4, 103, 6, 1860);
    			attr_dev(img2, "class", "play-icon svelte-2uso4e");
    			if (img2.src !== (img2_src_value = "images/playStore.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Download on Play Store");
    			add_location(img2, file$4, 107, 6, 1969);
    			attr_dev(div1, "class", "store-icons svelte-2uso4e");
    			add_location(div1, file$4, 101, 4, 1754);
    			attr_dev(div2, "class", "hero svelte-2uso4e");
    			add_location(div2, file$4, 94, 2, 1509);
    			attr_dev(div3, "class", "features svelte-2uso4e");
    			add_location(div3, file$4, 113, 2, 2097);
    			attr_dev(main, "class", "svelte-2uso4e");
    			add_location(main, file$4, 93, 0, 1500);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img0);
    			append_dev(div2, t1);
    			append_dev(div2, p0);
    			append_dev(div2, t3);
    			append_dev(div2, p1);
    			append_dev(div2, t5);
    			append_dev(div2, p2);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div1, img1);
    			append_dev(div1, t8);
    			append_dev(div1, img2);
    			append_dev(main, t9);
    			append_dev(main, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(main, t10);
    			mount_component(actions, main, null);
    			insert_dev(target, t11, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*features*/ 0) {
    				each_value = features;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(actions.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(actions.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			destroy_component(actions);
    			if (detaching) detach_dev(t11);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
