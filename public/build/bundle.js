
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

    /* src/components/Feature.svelte generated by Svelte v3.16.7 */

    const file = "src/components/Feature.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1;
    	let t2;
    	let p;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*description*/ ctx[2]);
    			attr_dev(img, "class", "feature-image svelte-1j8q67s");
    			if (img.src !== (img_src_value = "images/" + /*image*/ ctx[0] + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*title*/ ctx[1] + " image"));
    			add_location(img, file, 71, 2, 1124);
    			attr_dev(h3, "class", "feature-title svelte-1j8q67s");
    			add_location(h3, file, 73, 4, 1232);
    			attr_dev(p, "class", "feature-description svelte-1j8q67s");
    			add_location(p, file, 74, 4, 1275);
    			attr_dev(div0, "class", "text-wrapper svelte-1j8q67s");
    			add_location(div0, file, 72, 2, 1201);
    			attr_dev(div1, "class", "feature svelte-1j8q67s");
    			toggle_class(div1, "right", /*index*/ ctx[3] % 2 !== 0);
    			add_location(div1, file, 70, 0, 1070);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
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
    		id: create_fragment.name,
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

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			image: 0,
    			title: 1,
    			description: 2,
    			index: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feature",
    			options,
    			id: create_fragment.name
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
      description: "Lemmi helps people who have difficulty with speech communicate with ease, and re-connect with others.",
    };

    const features = [
      {
        title: "Mobile",
        description: "Lemmi is available on iOS and Android devices and is accessible anywhere. Once downloaded, it works with or without a network connection."
      },
      {
        title: "Simple",
        description: "The app's text, navigation and layout are clear and easy to use, making it appropriate for all ages and abilities."
      },
      {
        title: "Personal",
        description: "Personalise the app to everyday life by adding personal words, phrases and photos to Lemmi's custom dictionary."
      },
      {
        title: "Customisable",
        description: "Select a voice, language, and colour scheme to suit the users needs. iOS users can add additional voices via the device's accessibility settings."
      },
      {
        title: "Intuitive",
        description: "Text prediction facilitates faster communication by creating quick access to the most commonly used words."
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
      },
      social: {
        heading: "Follow Us"
      }
    };

    const links = {
      twitter: "https://twitter.com/lemmichat",
      facebook: "https://www.facebook.com/lemmichat",
      instagram: "https://www.instagram.com/lemmichat"
    };

    /* src/components/Actions.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/components/Actions.svelte";

    // (154:4) {:else}
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
    			attr_dev(input, "class", "wait-list svelte-1om8jq9");
    			attr_dev(input, "name", "wait-list");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "aria-label", "Wait List Sign Up");
    			add_location(input, file$1, 155, 8, 3000);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "class", "submit svelte-1om8jq9");
    			add_location(button, file$1, 162, 8, 3191);
    			attr_dev(div, "class", "sign-up svelte-1om8jq9");
    			add_location(div, file$1, 154, 6, 2970);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    				listen_dev(button, "click", /*handleSubmit*/ ctx[6], false, false, false)
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
    		source: "(154:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (152:4) {#if waitlistMsg}
    function create_if_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*waitlistMsg*/ ctx[2]);
    			attr_dev(p, "class", "message svelte-1om8jq9");
    			toggle_class(p, "success", /*waitlistSuccess*/ ctx[1]);
    			add_location(p, file$1, 152, 6, 2883);
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
    		source: "(152:4) {#if waitlistMsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div1;
    	let h10;
    	let t1;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let p;
    	let t4;
    	let div2;
    	let h11;
    	let t6;
    	let t7;
    	let div4;
    	let h12;
    	let t9;
    	let div3;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let a1_href_value;
    	let t10;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let a2_href_value;
    	let t11;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let a3_href_value;

    	function select_block_type(ctx, dirty) {
    		if (/*waitlistMsg*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = `${/*contact*/ ctx[3].heading}`;
    			t1 = space();
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t2 = space();
    			p = element("p");
    			p.textContent = `${/*contact*/ ctx[3].link}`;
    			t4 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = `${/*waitlist*/ ctx[4].heading}`;
    			t6 = space();
    			if_block.c();
    			t7 = space();
    			div4 = element("div");
    			h12 = element("h1");
    			h12.textContent = `${/*social*/ ctx[5].heading}`;
    			t9 = space();
    			div3 = element("div");
    			a1 = element("a");
    			img1 = element("img");
    			t10 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t11 = space();
    			a3 = element("a");
    			img3 = element("img");
    			attr_dev(h10, "class", "heading svelte-1om8jq9");
    			add_location(h10, file$1, 139, 4, 2466);
    			attr_dev(img0, "class", "contact-img svelte-1om8jq9");
    			if (img0.src !== (img0_src_value = "images/mail.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "contact icon");
    			add_location(img0, file$1, 144, 8, 2645);
    			add_location(p, file$1, 145, 8, 2722);
    			attr_dev(a0, "class", "email svelte-1om8jq9");
    			attr_dev(a0, "href", "mailto:info@lemmichat.com?subject=Contact from Website");
    			add_location(a0, file$1, 141, 6, 2541);
    			attr_dev(div0, "class", "contact svelte-1om8jq9");
    			add_location(div0, file$1, 140, 4, 2513);
    			attr_dev(div1, "class", "contact-wrapper svelte-1om8jq9");
    			add_location(div1, file$1, 138, 2, 2432);
    			attr_dev(h11, "class", "heading svelte-1om8jq9");
    			add_location(h11, file$1, 150, 4, 2811);
    			attr_dev(div2, "class", "sign-up-wrapper svelte-1om8jq9");
    			add_location(div2, file$1, 149, 2, 2777);
    			attr_dev(h12, "class", "heading svelte-1om8jq9");
    			add_location(h12, file$1, 169, 4, 3364);
    			attr_dev(img1, "class", "social-icon svelte-1om8jq9");
    			if (img1.src !== (img1_src_value = "images/twitter.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "social-icon");
    			add_location(img1, file$1, 172, 8, 3507);
    			attr_dev(a1, "href", a1_href_value = links.twitter);
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$1, 171, 6, 3443);
    			attr_dev(img2, "class", "social-icon svelte-1om8jq9");
    			if (img2.src !== (img2_src_value = "images/instagram.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "social-icon");
    			add_location(img2, file$1, 175, 8, 3661);
    			attr_dev(a2, "href", a2_href_value = links.instagram);
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$1, 174, 6, 3595);
    			attr_dev(img3, "class", "social-icon svelte-1om8jq9");
    			if (img3.src !== (img3_src_value = "images/facebook.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "social-icon");
    			add_location(img3, file$1, 178, 8, 3816);
    			attr_dev(a3, "href", a3_href_value = links.facebook);
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$1, 177, 6, 3751);
    			attr_dev(div3, "class", "social-links svelte-1om8jq9");
    			add_location(div3, file$1, 170, 4, 3410);
    			attr_dev(div4, "class", "social-wrapper svelte-1om8jq9");
    			add_location(div4, file$1, 168, 2, 3331);
    			attr_dev(div5, "class", "actions-wrapper svelte-1om8jq9");
    			add_location(div5, file$1, 137, 0, 2400);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, h10);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(a0, t2);
    			append_dev(a0, p);
    			append_dev(div5, t4);
    			append_dev(div5, div2);
    			append_dev(div2, h11);
    			append_dev(div2, t6);
    			if_block.m(div2, null);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, h12);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, a1);
    			append_dev(a1, img1);
    			append_dev(div3, t10);
    			append_dev(div3, a2);
    			append_dev(a2, img2);
    			append_dev(div3, t11);
    			append_dev(div3, a3);
    			append_dev(a3, img3);
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
    			if (detaching) detach_dev(div5);
    			if_block.d();
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

    function instance$1($$self, $$props, $$invalidate) {
    	const { contact, waitlist, social } = actions;
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
    		social,
    		handleSubmit,
    		successMsg,
    		errorMsg,
    		input_input_handler
    	];
    }

    class Actions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Actions",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Lemmi.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/components/Lemmi.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].title;
    	child_ctx[1] = list[i].description;
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (125:2) {#each features as { title, description }
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
    		source: "(125:2) {#each features as { title, description }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let h1;
    	let t2;
    	let h3;
    	let t4;
    	let p;
    	let t6;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let div3;
    	let t9;
    	let current;
    	let each_value = features;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const actions = new Actions({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = `${hero.title}`;
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = `${hero.subtitle}`;
    			t4 = space();
    			p = element("p");
    			p.textContent = `${hero.description}`;
    			t6 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t7 = space();
    			img2 = element("img");
    			t8 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			create_component(actions.$$.fragment);
    			if (img0.src !== (img0_src_value = "images/appIcon.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lemmi Logo");
    			attr_dev(img0, "class", "svelte-1dsy75b");
    			add_location(img0, file$2, 106, 4, 1701);
    			attr_dev(div0, "class", "logo svelte-1dsy75b");
    			add_location(div0, file$2, 105, 2, 1678);
    			attr_dev(h1, "class", "title svelte-1dsy75b");
    			add_location(h1, file$2, 108, 2, 1762);
    			attr_dev(h3, "class", "subtitle svelte-1dsy75b");
    			add_location(h3, file$2, 109, 2, 1800);
    			attr_dev(p, "class", "description svelte-1dsy75b");
    			add_location(p, file$2, 110, 2, 1844);
    			attr_dev(img1, "class", "app-icon svelte-1dsy75b");
    			if (img1.src !== (img1_src_value = "images/appStore.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Download on App Store");
    			add_location(img1, file$2, 113, 4, 1994);
    			attr_dev(img2, "class", "play-icon svelte-1dsy75b");
    			if (img2.src !== (img2_src_value = "images/playStore.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Download on Play Store");
    			add_location(img2, file$2, 117, 4, 2095);
    			attr_dev(div1, "class", "store-icons svelte-1dsy75b");
    			add_location(div1, file$2, 111, 2, 1892);
    			attr_dev(div2, "class", "hero svelte-1dsy75b");
    			add_location(div2, file$2, 104, 0, 1657);
    			attr_dev(div3, "class", "features svelte-1dsy75b");
    			add_location(div3, file$2, 123, 0, 2211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img0);
    			append_dev(div2, t0);
    			append_dev(div2, h1);
    			append_dev(div2, t2);
    			append_dev(div2, h3);
    			append_dev(div2, t4);
    			append_dev(div2, p);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, img1);
    			append_dev(div1, t7);
    			append_dev(div1, img2);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			insert_dev(target, t9, anchor);
    			mount_component(actions, target, anchor);
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

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(actions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t9);
    			destroy_component(actions, detaching);
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

    class Lemmi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lemmi",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.16.7 */

    const file$3 = "src/components/Footer.svelte";

    function create_fragment$3(ctx) {
    	let footer;
    	let div3;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let div2;
    	let div1;
    	let a0;
    	let t5;
    	let a1;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div3 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "© LemmiChat 2020";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "In loving memory of N. Lemmikki Hyry";
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Credits";
    			t5 = space();
    			a1 = element("a");
    			a1.textContent = "Privacy Policy";
    			add_location(p0, file$3, 50, 6, 751);
    			attr_dev(div0, "class", "copywrite svelte-1v02l5n");
    			add_location(div0, file$3, 49, 4, 721);
    			attr_dev(p1, "class", "memorial svelte-1v02l5n");
    			add_location(p1, file$3, 52, 4, 795);
    			attr_dev(a0, "href", "/credits.html");
    			attr_dev(a0, "class", "svelte-1v02l5n");
    			add_location(a0, file$3, 55, 8, 932);
    			attr_dev(a1, "href", "/privacy-policy.html");
    			attr_dev(a1, "class", "svelte-1v02l5n");
    			add_location(a1, file$3, 56, 8, 976);
    			attr_dev(div1, "class", "navigation svelte-1v02l5n");
    			add_location(div1, file$3, 54, 6, 899);
    			attr_dev(div2, "class", "navigation-wrapper svelte-1v02l5n");
    			add_location(div2, file$3, 53, 4, 860);
    			attr_dev(div3, "class", "footer-content svelte-1v02l5n");
    			add_location(div3, file$3, 48, 2, 688);
    			attr_dev(footer, "class", "svelte-1v02l5n");
    			add_location(footer, file$3, 47, 0, 677);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div3);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(div3, t1);
    			append_dev(div3, p1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t5);
    			append_dev(div1, a1);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let t;
    	let current;
    	const lemmi = new Lemmi({ $$inline: true });
    	const footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(lemmi.$$.fragment);
    			t = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main, "class", "svelte-xug696");
    			add_location(main, file$4, 14, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(lemmi, main, null);
    			insert_dev(target, t, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lemmi.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lemmi.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(lemmi);
    			if (detaching) detach_dev(t);
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
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
