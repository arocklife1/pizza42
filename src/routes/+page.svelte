<script lang='ts'>
  import LoginButton from "$lib/components/LoginButton.svelte";
  import LogoutButton from "$lib/components/LogoutButton.svelte";
  import Profile from "$lib/components/Profile.svelte";
  import { checkIDToken, getAPIToken, isLoggedIn, user } from "$lib/stores/auth";
  import {v4 as uuidv4} from 'uuid';

  let order = uuidv4()
  let size = $state('Medium')
  let name = $state($user?.preferred_username ?? '')
  let crust = $state('thin')
  let toppings = $state([] as string[])
  let notes = $state('')

  let orders = $state($user?.user_metadata?.orders ?? [])

	const toppingOptions = [
		'Pepperoni',
		'Sausage',
		'Mushrooms',
		'Onions',
		'Bacon',
		'Extra Cheese',
		'Peppers'
	];

  function toggleTopping(topping: string) {
		if (toppings.includes(topping)) {
			toppings = toppings.filter((t) => t !== topping);
		} else {
			toppings = [...toppings, topping];
		}
	}

  $effect(() => {
    orders = $user?.user_metadata?.orders ?? []
  })

</script>

{#if $isLoggedIn}
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <header class="navbar bg-base-100 border-b border-base-300 px-6 shadow-sm">
      <div class="flex-1">
        <h1 class="text-2xl font-bold">Pizza Portal</h1>
      </div>

      <div class="flex items-center gap-3">
        <button 
          class='bg-blue-500 hover:bg-blue-700 btn btn-sm' 
          onclick={() => console.log($user)}>
          Log user object
        </button>
        <button 
          class='bg-green-500 hover:bg-green-700 font-bold py-2 px-4 btn btn-sm' 
          onclick={async () => console.log(await checkIDToken())}>
          ID Claims
        </button>

        <div class="divider divider-horizontal"></div>

        <div class="flex items-center gap-3">
          <Profile></Profile>

          <LogoutButton></LogoutButton>

        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 p-6">
      <!-- Main Form -->
      <section class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">Submit Pizza Order</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <!-- Customer Name -->
            <div class="form-control">
              <label class="label" for='name'>
                <span class="label-text">Customer Name</span>
              </label>

              <input
                type="text"
                class="input input-bordered"
                bind:value={name}
                placeholder="Enter your name"
              />
            </div>

            <!-- Size -->
            <div class="form-control">
              <label class="label" for='size'>
                <span class="label-text">Pizza Size</span>
              </label>

              <select
                class="select select-bordered"
                bind:value={size}
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
                <option>Extra Large</option>
              </select>
            </div>

            <!-- Crust -->
            <div class="form-control md:col-span-2">
              <label class="label" for='type'>
                <span class="label-text">Crust Type</span>
              </label>

              <div class="flex flex-wrap gap-3">
                <label class="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    class="radio radio-primary"
                    bind:group={crust}
                    value="Thin"
                  />
                  <span>Thin</span>
                </label>

                <label class="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    class="radio radio-primary"
                    bind:group={crust}
                    value="Regular"
                  />
                  <span>Regular</span>
                </label>

                <label class="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    class="radio radio-primary"
                    bind:group={crust}
                    value="Stuffed"
                  />
                  <span>Stuffed</span>
                </label>
              </div>
            </div>

            <!-- Toppings -->
            <div class="form-control md:col-span-2">
              <label class="label" for='toppings'>
                <span class="label-text">Toppings</span>
              </label>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                {#each toppingOptions as topping}
                  <label class="label cursor-pointer justify-start gap-3 border border-base-300 rounded-lg px-3 py-2">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary"
                      checked={toppings.includes(topping)}
                      onchange={() => toggleTopping(topping)}
                    />

                    <span>{topping}</span>
                  </label>
                {/each}
              </div>
            </div>

            <!-- Notes -->
            <div class="form-control md:col-span-2">
              <label class="label" for='notes'>
                <span class="label-text">Special Notes</span>
              </label>

              <textarea
                class="textarea textarea-bordered h-28"
                bind:value={notes}
                placeholder="Extra crispy, cut into squares, etc..."
              ></textarea>
            </div>
          </div>

          <div class="card-actions justify-end mt-6">
            <button 
              class='btn btn-primary'
                onclick={async () => {
                  try {
                    await getAPIToken({ id: order, name, size, crust, toppings, notes, date: new Date().toLocaleDateString() });

                    orders = [
                      ...(orders ?? []),
                      { id: order, name, size, crust, toppings, notes, date: new Date().toLocaleDateString()}
                    ];

                    alert('Order submitted successfully');
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
              >
              Order food
            </button>
          </div>
        </div>
      </section>

      <!-- Sidebar -->
      <aside class="card bg-base-100 shadow-xl h-fit">
        <div class="card-body">
          <h2 class="card-title">Previous Orders</h2>

          <div class="space-y-3 mt-2">
            {#each orders as order}
              <div class="border border-base-300 rounded-xl p-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold">
                    {order.size} Pizza
                  </h3>

                  <div class="badge badge-outline">
                    {order.date}
                  </div>
                </div>

                <p class="text-sm text-base-content/70 mt-1">
                  Crust: {order.crust}
                </p>

                <div class="flex flex-wrap gap-2 mt-3">
                  {#each order.toppings as topping}
                    <div class="badge badge-primary badge-outline">
                      {topping}
                    </div>
                  {/each}
                </div>

                <button class="btn btn-xs btn-ghost mt-3">
                  Reorder
                </button>
              </div>
            {/each}
          </div>
        </div>
      </aside>
    </div>
  </div>
{:else}
    <LoginButton></LoginButton>
{/if}








