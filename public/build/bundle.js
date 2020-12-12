
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
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
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
            image: '/images/no-wifi.svg',
            title: "No connection necessary",
            description: "Once downloaded, Lemmi does not require an internet connection for you to communicate with others.",
          },
        ]
      },
      anatomy: [
        {
          title: "Predictive Words",
          desciption: "Suggested words appear to help you form phrases faster",
          image: "/images/predictive.svg"
        },
        {
          title: "Word Book",
          desciption: "Access word categories and add custom entries",
          image: "/images/book.svg"
        },
        {
          title: "Settings",
          desciption: "Customise the app, manage your subscription, and get help",
          image: "/images/settings.svg"
        },
        {
          title: "Connectivity",
          desciption: "Once downloaded, available anytime, anywhere",
          image: "/images/no-wifi.svg"
        },
        {
          title: "Play",
          desciption: "Tap for the text in the speech bar to be read aloud",
          image: "/images/play.svg"
        },
        {
          title: "Core Words",
          desciption: "Quick access core words such as 'Yes' and 'Please'",
          image: "/images/plus.svg"
        },
      ]
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
      newsletter: {
        heading: "Keep up to date with Lemmi's latest updates and offers",
        button: "Subscribe",
        success: "You have been successfully subscribed!",
        error: "Something went wrong - please check your email and try again. If you continue to have difficulties, please reach out on our contact page."
      }
    };

    const links = {
      email: "mailto:info@lemmichat.com?subject=New Contact from Website",
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
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (270:10) {#if index == carouselIndex}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*photo*/ ctx[11])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Screenshot of Lemmi running on iOS");
    			attr_dev(img, "class", "svelte-1b46cqf");
    			add_location(img, file$1, 270, 12, 4943);
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
    		source: "(270:10) {#if index == carouselIndex}",
    		ctx
    	});

    	return block;
    }

    // (269:8) {#each freetrial.images as photo, index}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*index*/ ctx[13] == /*carouselIndex*/ ctx[1] && create_if_block(ctx);

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
    			if (/*index*/ ctx[13] == /*carouselIndex*/ ctx[1]) {
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
    		source: "(269:8) {#each freetrial.images as photo, index}",
    		ctx
    	});

    	return block;
    }

    // (290:4) {#each help.usps as usp}
    function create_each_block$1(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p0;
    	let t1_value = /*usp*/ ctx[8].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*usp*/ ctx[8].description + "";
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
    			if (img.src !== (img_src_value = /*usp*/ ctx[8].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*usp*/ ctx[8].title);
    			attr_dev(img, "class", "svelte-1b46cqf");
    			add_location(img, file$1, 292, 10, 5574);
    			attr_dev(div0, "class", "usp-image-wrapper svelte-1b46cqf");
    			add_location(div0, file$1, 291, 8, 5532);
    			attr_dev(p0, "class", "usp-title svelte-1b46cqf");
    			add_location(p0, file$1, 294, 8, 5637);
    			attr_dev(p1, "class", "usp-description svelte-1b46cqf");
    			add_location(p1, file$1, 295, 8, 5696);
    			attr_dev(div1, "class", "usp svelte-1b46cqf");
    			add_location(div1, file$1, 290, 6, 5506);
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
    		source: "(290:4) {#each help.usps as usp}",
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
    	let div5;
    	let img2;
    	let img2_src_value;
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
    			div5 = element("div");
    			img2 = element("img");
    			attr_dev(h2, "class", "svelte-1b46cqf");
    			add_location(h2, file$1, 258, 6, 4377);
    			attr_dev(p0, "class", "svelte-1b46cqf");
    			add_location(p0, file$1, 259, 6, 4410);
    			attr_dev(button0, "class", "svelte-1b46cqf");
    			add_location(button0, file$1, 260, 6, 4444);
    			attr_dev(p1, "class", "home-freetrial__smallprint svelte-1b46cqf");
    			add_location(p1, file$1, 261, 6, 4531);
    			attr_dev(div0, "class", "home-freetrial__text svelte-1b46cqf");
    			add_location(div0, file$1, 257, 4, 4336);
    			if (img0.src !== (img0_src_value = "./images/chevron-left.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "View previous screenshot");
    			attr_dev(img0, "class", "svelte-1b46cqf");
    			add_location(img0, file$1, 266, 10, 4754);
    			attr_dev(button1, "class", "carousel_prev svelte-1b46cqf");
    			add_location(button1, file$1, 265, 8, 4693);
    			if (img1.src !== (img1_src_value = "./images/chevron-right.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "View next screenshot");
    			attr_dev(img1, "class", "svelte-1b46cqf");
    			add_location(img1, file$1, 274, 10, 5101);
    			attr_dev(button2, "class", "carousel_next svelte-1b46cqf");
    			add_location(button2, file$1, 273, 8, 5044);
    			attr_dev(div1, "class", "carousel_image svelte-1b46cqf");
    			add_location(div1, file$1, 264, 6, 4656);
    			attr_dev(div2, "class", "home-freetrial__carousel svelte-1b46cqf");
    			add_location(div2, file$1, 263, 4, 4611);
    			attr_dev(div3, "class", "wrapper svelte-1b46cqf");
    			add_location(div3, file$1, 256, 2, 4310);
    			attr_dev(section0, "class", "home-freetrial svelte-1b46cqf");
    			add_location(section0, file$1, 255, 0, 4275);
    			attr_dev(p2, "class", "svelte-1b46cqf");
    			add_location(p2, file$1, 281, 2, 5257);
    			attr_dev(p3, "class", "svelte-1b46cqf");
    			add_location(p3, file$1, 282, 2, 5280);
    			attr_dev(button3, "class", "svelte-1b46cqf");
    			add_location(button3, file$1, 283, 2, 5303);
    			attr_dev(section1, "class", "blurb svelte-1b46cqf");
    			add_location(section1, file$1, 280, 0, 5231);
    			attr_dev(h3, "class", "svelte-1b46cqf");
    			add_location(h3, file$1, 287, 2, 5421);
    			attr_dev(div4, "class", "usp-wrapper svelte-1b46cqf");
    			add_location(div4, file$1, 288, 2, 5445);
    			attr_dev(section2, "class", "help svelte-1b46cqf");
    			add_location(section2, file$1, 286, 0, 5396);
    			if (img2.src !== (img2_src_value = "images/test.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "test");
    			attr_dev(img2, "class", "svelte-1b46cqf");
    			add_location(img2, file$1, 302, 4, 5844);
    			attr_dev(div5, "class", "wrapper svelte-1b46cqf");
    			add_location(div5, file$1, 301, 2, 5818);
    			attr_dev(section3, "class", "anatomy svelte-1b46cqf");
    			add_location(section3, file$1, 300, 0, 5790);
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
    			append_dev(section3, div5);
    			append_dev(div5, img2);

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
    	const { freetrial, blurb, help, anatomy } = home;
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
    		each,
    		home,
    		pages,
    		freetrial,
    		blurb,
    		help,
    		anatomy,
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

    /* src/pages/Lemmi.svelte generated by Svelte v3.29.0 */
    const file$3 = "src/pages/Lemmi.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].title;
    	child_ctx[1] = list[i].description;
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (7:2) {#each features as { title, description }
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
    		source: "(7:2) {#each features as { title, description }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
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

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "features");
    			add_location(div, file$3, 5, 0, 118);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

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

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots("Lemmi", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lemmi> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Feature, features });
    	return [];
    }

    class Lemmi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lemmi",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.0 */
    const file$4 = "src/components/Footer.svelte";

    // (119:6) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let div;
    	let input;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block = /*newsletterMsg*/ ctx[2] && !/*newsletterSuccess*/ ctx[1] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = `${/*newsletter*/ ctx[3].button.toUpperCase()}`;
    			attr_dev(input, "id", "newletter");
    			attr_dev(input, "name", "newletter");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "aria-label", "Wait List Sign Up");
    			attr_dev(input, "class", "svelte-1phqhbx");
    			add_location(input, file$4, 123, 8, 2501);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "class", "submit svelte-1phqhbx");
    			add_location(button, file$4, 130, 8, 2699);
    			attr_dev(div, "class", "subscribe svelte-1phqhbx");
    			add_location(div, file$4, 122, 6, 2469);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*email*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*onInputChange*/ ctx[5], false, false, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*newsletterMsg*/ ctx[2] && !/*newsletterSuccess*/ ctx[1]) {
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(119:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (117:6) {#if newsletterMsg && newsletterSuccess}
    function create_if_block$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*newsletterMsg*/ ctx[2]);
    			attr_dev(p, "class", "message");
    			toggle_class(p, "success", /*newsletterSuccess*/ ctx[1]);
    			add_location(p, file$4, 117, 8, 2269);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newsletterMsg*/ 4) set_data_dev(t, /*newsletterMsg*/ ctx[2]);

    			if (dirty & /*newsletterSuccess*/ 2) {
    				toggle_class(p, "success", /*newsletterSuccess*/ ctx[1]);
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
    		source: "(117:6) {#if newsletterMsg && newsletterSuccess}",
    		ctx
    	});

    	return block;
    }

    // (120:6) {#if newsletterMsg && !newsletterSuccess}
    function create_if_block_1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*newsletterMsg*/ ctx[2]);
    			attr_dev(p, "class", "message");
    			add_location(p, file$4, 120, 8, 2412);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newsletterMsg*/ 4) set_data_dev(t, /*newsletterMsg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(120:6) {#if newsletterMsg && !newsletterSuccess}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let footer;
    	let div6;
    	let div0;
    	let p0;
    	let t1;
    	let t2;
    	let div1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let a0_href_value;
    	let t3;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let a1_href_value;
    	let t4;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let a2_href_value;
    	let t5;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let a3_href_value;
    	let t6;
    	let div5;
    	let div2;
    	let p1;
    	let t8;
    	let p2;
    	let t10;
    	let div4;
    	let div3;
    	let a4;
    	let t12;
    	let a5;

    	function select_block_type(ctx, dirty) {
    		if (/*newsletterMsg*/ ctx[2] && /*newsletterSuccess*/ ctx[1]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div6 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = `${/*newsletter*/ ctx[3].heading}`;
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			div1 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t3 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t4 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t5 = space();
    			a3 = element("a");
    			img3 = element("img");
    			t6 = space();
    			div5 = element("div");
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = "© 2020 Jenix Technologies LTD";
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "In loving memory of N. Lemmikki Hyry";
    			t10 = space();
    			div4 = element("div");
    			div3 = element("div");
    			a4 = element("a");
    			a4.textContent = "Privacy Policy";
    			t12 = space();
    			a5 = element("a");
    			a5.textContent = "Terms of Service";
    			attr_dev(p0, "class", "heading");
    			add_location(p0, file$4, 115, 6, 2170);
    			attr_dev(div0, "class", "subscribe-wrapper svelte-1phqhbx");
    			add_location(div0, file$4, 114, 4, 2132);
    			attr_dev(img0, "class", "social-icon svelte-1phqhbx");
    			if (img0.src !== (img0_src_value = "images/email.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "social-icon");
    			add_location(img0, file$4, 138, 6, 2946);
    			attr_dev(a0, "href", a0_href_value = links.email);
    			attr_dev(a0, "rel", "noopener");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$4, 137, 4, 2886);
    			attr_dev(img1, "class", "social-icon svelte-1phqhbx");
    			if (img1.src !== (img1_src_value = "images/twitter.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "social-icon");
    			add_location(img1, file$4, 141, 6, 3090);
    			attr_dev(a1, "href", a1_href_value = links.twitter);
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$4, 140, 4, 3028);
    			attr_dev(img2, "class", "social-icon svelte-1phqhbx");
    			if (img2.src !== (img2_src_value = "images/facebook.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "social-icon");
    			add_location(img2, file$4, 144, 6, 3237);
    			attr_dev(a2, "href", a2_href_value = links.facebook);
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$4, 143, 4, 3174);
    			attr_dev(img3, "class", "social-icon svelte-1phqhbx");
    			if (img3.src !== (img3_src_value = "images/instagram.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "social-icon");
    			add_location(img3, file$4, 147, 6, 3386);
    			attr_dev(a3, "href", a3_href_value = links.instagram);
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$4, 146, 4, 3322);
    			attr_dev(div1, "class", "social-links svelte-1phqhbx");
    			add_location(div1, file$4, 136, 2, 2855);
    			add_location(p1, file$4, 152, 6, 3539);
    			attr_dev(div2, "class", "copywrite svelte-1phqhbx");
    			add_location(div2, file$4, 151, 4, 3509);
    			attr_dev(p2, "class", "memorial svelte-1phqhbx");
    			add_location(p2, file$4, 154, 4, 3596);
    			attr_dev(a4, "href", "/privacy-policy.html");
    			attr_dev(a4, "class", "svelte-1phqhbx");
    			add_location(a4, file$4, 157, 8, 3733);
    			attr_dev(a5, "href", "/terms-of-service.html");
    			attr_dev(a5, "class", "svelte-1phqhbx");
    			add_location(a5, file$4, 158, 8, 3791);
    			attr_dev(div3, "class", "navigation svelte-1phqhbx");
    			add_location(div3, file$4, 156, 6, 3700);
    			attr_dev(div4, "class", "navigation-wrapper svelte-1phqhbx");
    			add_location(div4, file$4, 155, 4, 3661);
    			attr_dev(div5, "class", "small-print svelte-1phqhbx");
    			add_location(div5, file$4, 150, 2, 3479);
    			attr_dev(div6, "class", "footer-content svelte-1phqhbx");
    			add_location(div6, file$4, 113, 2, 2099);
    			add_location(footer, file$4, 112, 0, 2088);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div6);
    			append_dev(div6, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			if_block.m(div0, null);
    			append_dev(div6, t2);
    			append_dev(div6, div1);
    			append_dev(div1, a0);
    			append_dev(a0, img0);
    			append_dev(div1, t3);
    			append_dev(div1, a1);
    			append_dev(a1, img1);
    			append_dev(div1, t4);
    			append_dev(div1, a2);
    			append_dev(a2, img2);
    			append_dev(div1, t5);
    			append_dev(div1, a3);
    			append_dev(a3, img3);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, p1);
    			append_dev(div5, t8);
    			append_dev(div5, p2);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, a4);
    			append_dev(div3, t12);
    			append_dev(div3, a5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			if_block.d();
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
    	validate_slots("Footer", slots, []);
    	const { newsletter } = actions;
    	let email;
    	let successMsg = newsletter.success;
    	let newsletterSuccess = false;
    	let newsletterMsg;

    	async function handleSubmit() {
    		const url = "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-newsletter";

    		const res = await fetch(url, {
    			method: "POST",
    			body: JSON.stringify({ email })
    		});

    		const response = await res.json();

    		if (response.statusCode && response.statusCode === 200) {
    			$$invalidate(1, newsletterSuccess = true);
    			$$invalidate(2, newsletterMsg = successMsg);
    		} else {
    			const body = JSON.parse(response.body);
    			$$invalidate(1, newsletterSuccess = false);
    			$$invalidate(2, newsletterMsg = body.message);
    		}
    	}

    	function onInputChange(e) {
    		if (!newsletterMsg) {
    			return;
    		}

    		if (e.target.value === "" && newsletterMsg) {
    			$$invalidate(2, newsletterMsg = null);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	$$self.$capture_state = () => ({
    		actions,
    		links,
    		newsletter,
    		email,
    		successMsg,
    		newsletterSuccess,
    		newsletterMsg,
    		handleSubmit,
    		onInputChange
    	});

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("successMsg" in $$props) successMsg = $$props.successMsg;
    		if ("newsletterSuccess" in $$props) $$invalidate(1, newsletterSuccess = $$props.newsletterSuccess);
    		if ("newsletterMsg" in $$props) $$invalidate(2, newsletterMsg = $$props.newsletterMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		email,
    		newsletterSuccess,
    		newsletterMsg,
    		newsletter,
    		handleSubmit,
    		onInputChange,
    		input_input_handler
    	];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
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
    			add_location(main, file$5, 26, 0, 601);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
