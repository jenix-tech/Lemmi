
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function empty() {
        return text('');
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
        input.value = value == null ? '' : value;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
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
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    const hero = {
      title: "Lemmi",
      subtitle: "The assistive app that lets you chat!",
      description: "Discover a world of possibilities with this customisable speech app that gives you the independence to take part in conversations wherever you are, with or without a network connection.",
    };

    const home = {
      freetrial: {
        title: "Get a weeks FREE trial",
        subtitle: "Enjoy our ad-free personalisable, speech app.",
        button: "Get 1 week free",
        desciption: "From only £3.50/month on a yearly plan. Terms of Service apply.",
        images: ["images/chat.png", "images/personalise.png", "images/save-time.png", "images/simple-to-use.png", "images/customise.png"]
      },
      blurb: {
        text1: "Discover a world of possibilities with this unique text-to-speech (AAC) app that gives users a voice of their own.",
        text2: "Lemmi enables users the freedom and independence to fully take part in conversations and to share thoughts and needs clearly with others.",
        action: "SHOW ME HOW"
      },
      help: {
        title: "Lemmi helps you...",
        usps: [
          {
            image: '/images/communicate-with-ease.svg',
            title: "Communicate with ease",
            description: "Type your own words or select from over 600 other options which the app will read aloud.",
          },
          {
            image: '/images/keep-up-with-conversations.svg',
            title: "Keep up with conversations",
            description: "Suggested word prompts are shown to help keep your conversations flowing.",
          },
          {
            image: '/images/no-connection-necessary.svg',
            title: "No connection necessary",
            description: "Once downloaded, Lemmi does not require an internet connection for you to communicate with others.",
          },
        ]
      }
    };

    const features = [
      {
        title: "Chat",
        description: "Use your smart device to build your own sentences from over 700 words that Lemmi will repeat out loud for you, wherever you are."
      },
      {
        title: "Personalise",
        description: "Our user-friendly design includes a clear menu, easy navigation and simple graphics, making it appropriate for all ages and abilities."
      },
      {
        title: "Save time",
        description: "Create your own vocabulary by adding words, phrases and photos to your private 'Word Book'. Lemmi will back-up and sync these personalisations across multiple devices with a valid iCloud or Google account."
      },
      {
        title: "Simple to use",
        description: "Suggested words will appear underneath the Speech Bar. Lemmi bases these off of words you’ve previously used in succession, and enable you to keep up with flowing conversations."
      },
      {
        title: "Customise",
        description: "Match your personality by choosing Lemmi’s voice from a range of options in the in-app settings. Lemmi currently supports English-speaking voices with support for additional languages coming soon!"
      },
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

    const pages = {
      home: 'Home',
      app: 'App',
      about: 'About',
      pricing: 'Pricing',
      faqs: 'FAQs',
      contact: 'Contact'
    };

    /* src/components/Header.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1 } = globals;
    const file = "src/components/Header.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (154:4) {#each Object.values(pages) as pageTitle}
    function create_each_block(ctx) {
    	let li;
    	let button;
    	let t0_value = /*pageTitle*/ ctx[3] + "";
    	let t0;
    	let button_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[2](/*pageTitle*/ ctx[3], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[3]
			? "selected"
			: ""}`) + " svelte-hlk0km"));

    			add_location(button, file, 155, 8, 2659);
    			add_location(li, file, 154, 6, 2646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*page*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[3]
			? "selected"
			: ""}`) + " svelte-hlk0km"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(154:4) {#each Object.values(pages) as pageTitle}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let section;
    	let h1;
    	let t2;
    	let h3;
    	let t4;
    	let div;
    	let button0;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let button1;
    	let img2;
    	let img2_src_value;
    	let t6;
    	let nav;
    	let ul;
    	let each_value = Object.values(pages);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			img0 = element("img");
    			t0 = space();
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = `${hero.title}`;
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = `${hero.subtitle}`;
    			t4 = space();
    			div = element("div");
    			button0 = element("button");
    			img1 = element("img");
    			t5 = space();
    			button1 = element("button");
    			img2 = element("img");
    			t6 = space();
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img0, "class", "hero-image svelte-hlk0km");
    			if (img0.src !== (img0_src_value = "images/hero-image.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lemmi shown on an iPad and iPhone");
    			add_location(img0, file, 126, 2, 1977);
    			attr_dev(h1, "class", "title svelte-hlk0km");
    			add_location(h1, file, 132, 4, 2120);
    			attr_dev(h3, "class", "subtitle svelte-hlk0km");
    			add_location(h3, file, 133, 4, 2160);
    			attr_dev(img1, "class", "app-icon svelte-hlk0km");
    			if (img1.src !== (img1_src_value = "images/app-store.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Download on the App Store");
    			add_location(img1, file, 136, 8, 2255);
    			attr_dev(button0, "class", "svelte-hlk0km");
    			add_location(button0, file, 135, 6, 2238);
    			attr_dev(img2, "class", "play-icon svelte-hlk0km");
    			if (img2.src !== (img2_src_value = "images/play-store.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Download on the Play Store");
    			add_location(img2, file, 142, 8, 2408);
    			attr_dev(button1, "class", "svelte-hlk0km");
    			add_location(button1, file, 141, 6, 2391);
    			attr_dev(div, "class", "store-icons svelte-hlk0km");
    			add_location(div, file, 134, 4, 2206);
    			attr_dev(section, "class", "hero-info svelte-hlk0km");
    			add_location(section, file, 131, 2, 2088);
    			attr_dev(header, "class", "hero svelte-hlk0km");
    			add_location(header, file, 122, 0, 1860);
    			attr_dev(ul, "class", "svelte-hlk0km");
    			add_location(ul, file, 152, 2, 2589);
    			attr_dev(nav, "class", "svelte-hlk0km");
    			add_location(nav, file, 151, 0, 2581);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img0);
    			append_dev(header, t0);
    			append_dev(header, section);
    			append_dev(section, h1);
    			append_dev(section, t2);
    			append_dev(section, h3);
    			append_dev(section, t4);
    			append_dev(section, div);
    			append_dev(div, button0);
    			append_dev(button0, img1);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, img2);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page, Object, pages, handleClickNavigation*/ 3) {
    				each_value = Object.values(pages);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { page } = $$props;
    	let { handleClickNavigation } = $$props;
    	const writable_props = ["page", "handleClickNavigation"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = pageTitle => handleClickNavigation(pageTitle);

    	$$self.$$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(1, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	$$self.$capture_state = () => ({ hero, pages, page, handleClickNavigation });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(1, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, handleClickNavigation, click_handler];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { page: 0, handleClickNavigation: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !("page" in props)) {
    			console.warn("<Header> was created without expected prop 'page'");
    		}

    		if (/*handleClickNavigation*/ ctx[1] === undefined && !("handleClickNavigation" in props)) {
    			console.warn("<Header> was created without expected prop 'handleClickNavigation'");
    		}
    	}

    	get page() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClickNavigation() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClickNavigation(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Home.svelte generated by Svelte v3.29.0 */
    const file$1 = "src/pages/Home.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (213:10) {#if index == carouselIndex}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*photo*/ ctx[10])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Screenshot of Lemmi running on iOS");
    			attr_dev(img, "class", "svelte-sui02h");
    			add_location(img, file$1, 213, 12, 4044);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(213:10) {#if index == carouselIndex}",
    		ctx
    	});

    	return block;
    }

    // (212:8) {#each freetrial.images as photo, index}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*index*/ ctx[12] == /*carouselIndex*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[12] == /*carouselIndex*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(212:8) {#each freetrial.images as photo, index}",
    		ctx
    	});

    	return block;
    }

    // (233:4) {#each help.usps as usp}
    function create_each_block$1(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p0;
    	let t1_value = /*usp*/ ctx[7].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*usp*/ ctx[7].description + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (img.src !== (img_src_value = /*usp*/ ctx[7].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*usp*/ ctx[7].title);
    			attr_dev(img, "class", "svelte-sui02h");
    			add_location(img, file$1, 235, 10, 4675);
    			attr_dev(div0, "class", "usp-image-wrapper svelte-sui02h");
    			add_location(div0, file$1, 234, 8, 4633);
    			attr_dev(p0, "class", "usp-title svelte-sui02h");
    			add_location(p0, file$1, 237, 8, 4738);
    			attr_dev(p1, "class", "usp-description svelte-sui02h");
    			add_location(p1, file$1, 238, 8, 4797);
    			attr_dev(div1, "class", "usp svelte-sui02h");
    			add_location(div1, file$1, 233, 6, 4607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(p1, t3);
    			append_dev(div1, t4);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(233:4) {#each help.usps as usp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section0;
    	let div3;
    	let div0;
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let button0;
    	let t5;
    	let p1;
    	let t7;
    	let div2;
    	let div1;
    	let button1;
    	let img0;
    	let img0_src_value;
    	let t8;
    	let t9;
    	let button2;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let section1;
    	let p2;
    	let t12;
    	let p3;
    	let t14;
    	let button3;
    	let t16;
    	let section2;
    	let h3;
    	let t18;
    	let div4;
    	let t19;
    	let section3;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*freetrial*/ ctx[2].images;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*help*/ ctx[4].usps;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*freetrial*/ ctx[2].title}`;
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `${/*freetrial*/ ctx[2].subtitle}`;
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Get 1 week free";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = `${/*freetrial*/ ctx[2].desciption}`;
    			t7 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button1 = element("button");
    			img0 = element("img");
    			t8 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t9 = space();
    			button2 = element("button");
    			img1 = element("img");
    			t10 = space();
    			section1 = element("section");
    			p2 = element("p");
    			p2.textContent = `${/*blurb*/ ctx[3].text1}`;
    			t12 = space();
    			p3 = element("p");
    			p3.textContent = `${/*blurb*/ ctx[3].text2}`;
    			t14 = space();
    			button3 = element("button");
    			button3.textContent = `${/*blurb*/ ctx[3].action}`;
    			t16 = space();
    			section2 = element("section");
    			h3 = element("h3");
    			h3.textContent = `${/*help*/ ctx[4].title}`;
    			t18 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			section3 = element("section");
    			attr_dev(h2, "class", "svelte-sui02h");
    			add_location(h2, file$1, 201, 6, 3478);
    			attr_dev(p0, "class", "svelte-sui02h");
    			add_location(p0, file$1, 202, 6, 3511);
    			attr_dev(button0, "class", "svelte-sui02h");
    			add_location(button0, file$1, 203, 6, 3545);
    			attr_dev(p1, "class", "home-freetrial__smallprint svelte-sui02h");
    			add_location(p1, file$1, 204, 6, 3632);
    			attr_dev(div0, "class", "home-freetrial__text svelte-sui02h");
    			add_location(div0, file$1, 200, 4, 3437);
    			if (img0.src !== (img0_src_value = "./images/chevron-left.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "View previous screenshot");
    			attr_dev(img0, "class", "svelte-sui02h");
    			add_location(img0, file$1, 209, 10, 3855);
    			attr_dev(button1, "class", "carousel_prev svelte-sui02h");
    			add_location(button1, file$1, 208, 8, 3794);
    			if (img1.src !== (img1_src_value = "./images/chevron-right.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "View next screenshot");
    			attr_dev(img1, "class", "svelte-sui02h");
    			add_location(img1, file$1, 217, 10, 4202);
    			attr_dev(button2, "class", "carousel_next svelte-sui02h");
    			add_location(button2, file$1, 216, 8, 4145);
    			attr_dev(div1, "class", "carousel_image svelte-sui02h");
    			add_location(div1, file$1, 207, 6, 3757);
    			attr_dev(div2, "class", "home-freetrial__carousel svelte-sui02h");
    			add_location(div2, file$1, 206, 4, 3712);
    			attr_dev(div3, "class", "wrapper svelte-sui02h");
    			add_location(div3, file$1, 199, 2, 3411);
    			attr_dev(section0, "class", "home-freetrial svelte-sui02h");
    			add_location(section0, file$1, 198, 0, 3376);
    			attr_dev(p2, "class", "svelte-sui02h");
    			add_location(p2, file$1, 224, 2, 4358);
    			attr_dev(p3, "class", "svelte-sui02h");
    			add_location(p3, file$1, 225, 2, 4381);
    			attr_dev(button3, "class", "svelte-sui02h");
    			add_location(button3, file$1, 226, 2, 4404);
    			attr_dev(section1, "class", "blurb svelte-sui02h");
    			add_location(section1, file$1, 223, 0, 4332);
    			attr_dev(h3, "class", "svelte-sui02h");
    			add_location(h3, file$1, 230, 2, 4522);
    			attr_dev(div4, "class", "usp-wrapper svelte-sui02h");
    			add_location(div4, file$1, 231, 2, 4546);
    			attr_dev(section2, "class", "help svelte-sui02h");
    			add_location(section2, file$1, 229, 0, 4497);
    			attr_dev(section3, "class", "anatomy");
    			add_location(section3, file$1, 243, 0, 4891);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, button0);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(button1, img0);
    			append_dev(div1, t8);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div1, t9);
    			append_dev(div1, button2);
    			append_dev(button2, img1);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, p2);
    			append_dev(section1, t12);
    			append_dev(section1, p3);
    			append_dev(section1, t14);
    			append_dev(section1, button3);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h3);
    			append_dev(section2, t18);
    			append_dev(section2, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			insert_dev(target, t19, anchor);
    			insert_dev(target, section3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*handleClickNavigation*/ ctx[0](pages.pricing))) /*handleClickNavigation*/ ctx[0](pages.pricing).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*previous*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*next*/ ctx[5], false, false, false),
    					listen_dev(
    						button3,
    						"click",
    						function () {
    							if (is_function(/*handleClickNavigation*/ ctx[0](pages.faqs))) /*handleClickNavigation*/ ctx[0](pages.faqs).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*freetrial, carouselIndex*/ 6) {
    				each_value_1 = /*freetrial*/ ctx[2].images;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, t9);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*help*/ 16) {
    				each_value = /*help*/ ctx[4].usps;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(section2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(section3);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const { freetrial, blurb, help } = home;
    	let carouselIndex = 0;
    	const next = () => $$invalidate(1, carouselIndex = (carouselIndex + 1) % freetrial.images.length);
    	const previous = () => $$invalidate(1, carouselIndex = (carouselIndex - 1) % freetrial.images.length);
    	let { handleClickNavigation } = $$props;
    	const writable_props = ["handleClickNavigation"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("handleClickNavigation" in $$props) $$invalidate(0, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	$$self.$capture_state = () => ({
    		home,
    		pages,
    		freetrial,
    		blurb,
    		help,
    		carouselIndex,
    		next,
    		previous,
    		handleClickNavigation
    	});

    	$$self.$inject_state = $$props => {
    		if ("carouselIndex" in $$props) $$invalidate(1, carouselIndex = $$props.carouselIndex);
    		if ("handleClickNavigation" in $$props) $$invalidate(0, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [handleClickNavigation, carouselIndex, freetrial, blurb, help, next, previous];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { handleClickNavigation: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handleClickNavigation*/ ctx[0] === undefined && !("handleClickNavigation" in props)) {
    			console.warn("<Home> was created without expected prop 'handleClickNavigation'");
    		}
    	}

    	get handleClickNavigation() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClickNavigation(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Feature.svelte generated by Svelte v3.29.0 */

    const file$2 = "src/components/Feature.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let img;
    	let img_class_value;
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

    			attr_dev(img, "class", img_class_value = "" + (null_to_empty(`feature-image ${/*image*/ ctx[0] === "customisable"
			? "customisable"
			: ""}`) + " svelte-6i0wxl"));

    			if (img.src !== (img_src_value = "images/" + /*image*/ ctx[0] + ".gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*title*/ ctx[1] + " image"));
    			add_location(img, file$2, 50, 2, 825);
    			attr_dev(h3, "class", "feature-title svelte-6i0wxl");
    			add_location(h3, file$2, 55, 4, 997);
    			attr_dev(p, "class", "feature-description svelte-6i0wxl");
    			add_location(p, file$2, 56, 4, 1040);
    			attr_dev(div0, "class", "text-wrapper svelte-6i0wxl");
    			add_location(div0, file$2, 54, 2, 966);
    			attr_dev(div1, "class", "feature svelte-6i0wxl");
    			toggle_class(div1, "right", /*index*/ ctx[3] % 2 !== 0);
    			add_location(div1, file$2, 49, 0, 771);
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
    			if (dirty & /*image*/ 1 && img_class_value !== (img_class_value = "" + (null_to_empty(`feature-image ${/*image*/ ctx[0] === "customisable"
			? "customisable"
			: ""}`) + " svelte-6i0wxl"))) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (dirty & /*image*/ 1 && img.src !== (img_src_value = "images/" + /*image*/ ctx[0] + ".gif")) {
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Feature", slots, []);
    	let { image } = $$props;
    	let { title } = $$props;
    	let { description } = $$props;
    	let { index } = $$props;
    	const writable_props = ["image", "title", "description", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Feature> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({ image, title, description, index });

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [image, title, description, index];
    }

    class Feature extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
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
    		const props = options.props || {};

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

    /* src/components/Actions.svelte generated by Svelte v3.29.0 */
    const file$3 = "src/components/Actions.svelte";

    // (168:4) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let div;
    	let input;
    	let t1;
    	let button;
    	let t3;
    	let p;
    	let mounted;
    	let dispose;
    	let if_block = /*waitlistMsg*/ ctx[2] && !/*waitlistSuccess*/ ctx[1] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = `${/*waitlist*/ ctx[4].button}`;
    			t3 = space();
    			p = element("p");
    			p.textContent = "We will only email to let you know when Lemmi is released, and to keep\n        you up-to-date with the latest Lemmi updates and special offers. (Max. 4\n        times a year)";
    			attr_dev(input, "id", "wait-list");
    			attr_dev(input, "class", "wait-list svelte-16dd8yn");
    			attr_dev(input, "name", "wait-list");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "aria-label", "Wait List Sign Up");
    			add_location(input, file$3, 172, 8, 3409);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "class", "submit svelte-16dd8yn");
    			add_location(button, file$3, 180, 8, 3635);
    			attr_dev(div, "class", "sign-up svelte-16dd8yn");
    			add_location(div, file$3, 171, 6, 3379);
    			attr_dev(p, "class", "message sign-up-message svelte-16dd8yn");
    			add_location(p, file$3, 184, 6, 3760);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*email*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, button);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(input, "input", /*onInputChange*/ ctx[7], false, false, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*waitlistMsg*/ ctx[2] && !/*waitlistSuccess*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*email*/ 1 && input.value !== /*email*/ ctx[0]) {
    				set_input_value(input, /*email*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(168:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (166:4) {#if waitlistMsg && waitlistSuccess}
    function create_if_block$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*waitlistMsg*/ ctx[2]);
    			attr_dev(p, "class", "message svelte-16dd8yn");
    			toggle_class(p, "success", /*waitlistSuccess*/ ctx[1]);
    			add_location(p, file$3, 166, 6, 3191);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(166:4) {#if waitlistMsg && waitlistSuccess}",
    		ctx
    	});

    	return block;
    }

    // (169:6) {#if waitlistMsg && !waitlistSuccess}
    function create_if_block_1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*waitlistMsg*/ ctx[2]);
    			attr_dev(p, "class", "message svelte-16dd8yn");
    			add_location(p, file$3, 169, 8, 3324);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*waitlistMsg*/ 4) set_data_dev(t, /*waitlistMsg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(169:6) {#if waitlistMsg && !waitlistSuccess}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
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
    		if (/*waitlistMsg*/ ctx[2] && /*waitlistSuccess*/ ctx[1]) return create_if_block$1;
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
    			attr_dev(h10, "class", "heading svelte-16dd8yn");
    			add_location(h10, file$3, 153, 4, 2742);
    			attr_dev(img0, "class", "contact-img svelte-16dd8yn");
    			if (img0.src !== (img0_src_value = "images/mail.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "contact icon");
    			add_location(img0, file$3, 158, 8, 2921);
    			add_location(p, file$3, 159, 8, 2998);
    			attr_dev(a0, "class", "email svelte-16dd8yn");
    			attr_dev(a0, "href", "mailto:info@lemmichat.com?subject=Contact from Website");
    			add_location(a0, file$3, 155, 6, 2817);
    			attr_dev(div0, "class", "contact svelte-16dd8yn");
    			add_location(div0, file$3, 154, 4, 2789);
    			attr_dev(div1, "class", "contact-wrapper svelte-16dd8yn");
    			add_location(div1, file$3, 152, 2, 2708);
    			attr_dev(h11, "class", "heading svelte-16dd8yn");
    			add_location(h11, file$3, 164, 4, 3100);
    			attr_dev(div2, "id", "sign-up");
    			attr_dev(div2, "class", "sign-up-wrapper svelte-16dd8yn");
    			add_location(div2, file$3, 163, 2, 3053);
    			attr_dev(h12, "class", "heading svelte-16dd8yn");
    			add_location(h12, file$3, 192, 4, 4043);
    			attr_dev(img1, "class", "social-icon svelte-16dd8yn");
    			if (img1.src !== (img1_src_value = "images/twitter.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "social-icon");
    			add_location(img1, file$3, 195, 8, 4186);
    			attr_dev(a1, "href", a1_href_value = links.twitter);
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$3, 194, 6, 4122);
    			attr_dev(img2, "class", "social-icon svelte-16dd8yn");
    			if (img2.src !== (img2_src_value = "images/instagram.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "social-icon");
    			add_location(img2, file$3, 198, 8, 4340);
    			attr_dev(a2, "href", a2_href_value = links.instagram);
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$3, 197, 6, 4274);
    			attr_dev(img3, "class", "social-icon svelte-16dd8yn");
    			if (img3.src !== (img3_src_value = "images/facebook.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "social-icon");
    			add_location(img3, file$3, 201, 8, 4495);
    			attr_dev(a3, "href", a3_href_value = links.facebook);
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$3, 200, 6, 4430);
    			attr_dev(div3, "class", "social-links svelte-16dd8yn");
    			add_location(div3, file$3, 193, 4, 4089);
    			attr_dev(div4, "class", "social-wrapper svelte-16dd8yn");
    			add_location(div4, file$3, 191, 2, 4010);
    			attr_dev(div5, "class", "actions-wrapper svelte-16dd8yn");
    			add_location(div5, file$3, 151, 0, 2676);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Actions", slots, []);
    	const { contact, waitlist, social } = actions;
    	let email;
    	let successMsg = waitlist.success;
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
    			const body = JSON.parse(response.body);
    			$$invalidate(1, waitlistSuccess = false);
    			$$invalidate(2, waitlistMsg = body.message);
    		}
    	}

    	function onInputChange(e) {
    		if (!waitlistMsg) {
    			return;
    		}

    		if (e.target.value === "" && waitlistMsg) {
    			$$invalidate(2, waitlistMsg = null);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Actions> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	$$self.$capture_state = () => ({
    		actions,
    		links,
    		contact,
    		waitlist,
    		social,
    		email,
    		successMsg,
    		waitlistSuccess,
    		waitlistMsg,
    		handleSubmit,
    		onInputChange
    	});

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("successMsg" in $$props) successMsg = $$props.successMsg;
    		if ("waitlistSuccess" in $$props) $$invalidate(1, waitlistSuccess = $$props.waitlistSuccess);
    		if ("waitlistMsg" in $$props) $$invalidate(2, waitlistMsg = $$props.waitlistMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		email,
    		waitlistSuccess,
    		waitlistMsg,
    		contact,
    		waitlist,
    		social,
    		handleSubmit,
    		onInputChange,
    		input_input_handler
    	];
    }

    class Actions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Actions",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/Lemmi.svelte generated by Svelte v3.29.0 */
    const file$4 = "src/pages/Lemmi.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].title;
    	child_ctx[1] = list[i].description;
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (8:2) {#each features as { title, description }
    function create_each_block$2(ctx) {
    	let feature;
    	let current;

    	feature = new Feature({
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(8:2) {#each features as { title, description }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t;
    	let actions;
    	let current;
    	let each_value = features;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	actions = new Actions({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(actions.$$.fragment);
    			attr_dev(div, "class", "features");
    			add_location(div, file$4, 6, 0, 172);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t, anchor);
    			mount_component(actions, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*features*/ 0) {
    				each_value = features;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(actions, detaching);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lemmi", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lemmi> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Feature, Actions, features });
    	return [];
    }

    class Lemmi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lemmi",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.0 */

    const file$5 = "src/components/Footer.svelte";

    function create_fragment$5(ctx) {
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
    			p0.textContent = "© 2020 Jenix Technologies LTD";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "In loving memory of N. Lemmikki Hyry";
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Privacy Policy";
    			t5 = space();
    			a1 = element("a");
    			a1.textContent = "Terms of Service";
    			add_location(p0, file$5, 37, 6, 570);
    			attr_dev(div0, "class", "copywrite svelte-1fy87j8");
    			add_location(div0, file$5, 36, 4, 540);
    			attr_dev(p1, "class", "memorial svelte-1fy87j8");
    			add_location(p1, file$5, 39, 4, 627);
    			attr_dev(a0, "href", "/privacy-policy.html");
    			attr_dev(a0, "class", "svelte-1fy87j8");
    			add_location(a0, file$5, 42, 8, 764);
    			attr_dev(a1, "href", "/terms-of-service.html");
    			attr_dev(a1, "class", "svelte-1fy87j8");
    			add_location(a1, file$5, 43, 8, 822);
    			attr_dev(div1, "class", "navigation svelte-1fy87j8");
    			add_location(div1, file$5, 41, 6, 731);
    			attr_dev(div2, "class", "navigation-wrapper svelte-1fy87j8");
    			add_location(div2, file$5, 40, 4, 692);
    			attr_dev(div3, "class", "footer-content svelte-1fy87j8");
    			add_location(div3, file$5, 35, 2, 507);
    			add_location(footer, file$5, 34, 0, 496);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */
    const file$6 = "src/App.svelte";

    function create_fragment$6(ctx) {
    	let header;
    	let t0;
    	let main;
    	let switch_instance;
    	let t1;
    	let footer;
    	let current;

    	header = new Header({
    			props: {
    				page: /*page*/ ctx[0],
    				handleClickNavigation: /*handleClickNavigation*/ ctx[2]
    			},
    			$$inline: true
    		});

    	var switch_value = /*components*/ ctx[1][/*page*/ ctx[0]];

    	function switch_props(ctx) {
    		return {
    			props: {
    				handleClickNavigation: /*handleClickNavigation*/ ctx[2]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			add_location(main, file$6, 26, 0, 601);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*page*/ 1) header_changes.page = /*page*/ ctx[0];
    			header.$set(header_changes);

    			if (switch_value !== (switch_value = /*components*/ ctx[1][/*page*/ ctx[0]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const components = { [pages.home]: Home, [pages.app]: Lemmi }; // [pages.about]: About,
    	// [pages.pricing]: Pricing,
    	// [pages.faqs]: FAQS,

    	// [pages.contact]: Contact
    	let page = pages.home;

    	let handleClickNavigation = selected => {
    		$$invalidate(0, page = selected);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		Home,
    		Lemmi,
    		Footer,
    		pages,
    		components,
    		page,
    		handleClickNavigation
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(2, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, components, handleClickNavigation];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
